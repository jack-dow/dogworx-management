import { cookies, headers } from "next/headers";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { schema } from "~/db/drizzle";
import { organizationInviteLinks, organizations, sessions, users } from "~/db/schema/auth";
import { UpdateUserSchema, type InsertUserSchema } from "~/db/validation/auth";
import {
	createSessionJWT,
	generateId,
	sessionCookieOptions,
	sessionJWTExpiry,
	SignUpSchema,
	type SessionCookie,
} from "~/lib/utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const userRouter = createTRPCRouter({
	create: publicProcedure
		.input(z.object({ inviteLinkId: z.string(), user: SignUpSchema }))
		.mutation(async ({ ctx, input }) => {
			const existingUser = await ctx.db.query.users.findFirst({
				where: (users, { eq }) => eq(users.emailAddress, input.user.emailAddress),
			});

			if (existingUser) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Email address already in use",
				});
			}

			const inviteLink = await ctx.db.query.organizationInviteLinks.findFirst({
				where: (organizationInviteLinks, { sql }) => sql`BINARY ${organizationInviteLinks.id} = ${input.inviteLinkId}`,

				columns: {
					id: true,
					createdAt: true,
					expiresAfter: true,
					maxUses: true,
					uses: true,
					organizationId: true,
				},
			});

			if (
				!inviteLink ||
				(inviteLink.maxUses && inviteLink.uses >= inviteLink.maxUses) ||
				inviteLink.createdAt.setSeconds(inviteLink.createdAt.getSeconds() + inviteLink.expiresAfter) <
					new Date().getTime()
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"The invite link is invalid or expired. Please request another from your organization owner and try again.",
				});
			}

			const newUser = {
				id: generateId(),
				...input.user,
				organizationId: inviteLink.organizationId,
				organizationRole: "member",
			} satisfies InsertUserSchema;

			await ctx.db.transaction(async (trx) => {
				await trx.insert(users).values(newUser);

				if (inviteLink.maxUses && inviteLink.uses + 1 >= inviteLink.maxUses) {
					await trx.delete(organizationInviteLinks).where(sql`BINARY ${organizationInviteLinks.id} = ${inviteLink.id}`);
				} else {
					await trx
						.update(organizationInviteLinks)
						.set({
							uses: inviteLink.uses + 1,
						})
						.where(sql`BINARY ${organizationInviteLinks.id} = ${inviteLink.id}`);
				}
			});

			const user = await ctx.db.query.users.findFirst({
				where: eq(users.id, newUser.id),
			});

			if (user) {
				return { data: user };
			}

			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to create user",
			});
		}),

	update: publicProcedure
		.input(
			UpdateUserSchema.pick({ givenName: true, familyName: true, emailAddress: true, profileImageUrl: true }).extend({
				timezone: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { timezone, ...data } = input;

			if (timezone) {
				try {
					// If timezone is invalid, this will throw an error
					dayjs().tz(timezone, true);

					cookies().set("timezone", timezone, {
						httpOnly: true,
						path: "/",
						sameSite: "lax",
						secure: process.env.NODE_ENV === "production",
						maxAge: 60 * 60 * 24 * 365,
					});
				} catch (error) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid timezone",
					});
				}
			}

			if (ctx.session) {
				if (Object.keys(data).length > 0) {
					await ctx.db.update(users).set(input).where(eq(users.id, ctx.user!.id));

					const newSessionToken = await createSessionJWT({
						id: ctx.user!.id,
						user: {
							...ctx.user!,
							...input,
						},
					});

					cookies().set({
						...sessionCookieOptions,
						value: newSessionToken,
					});
				}
			}
		}),

	sessions: createTRPCRouter({
		current: publicProcedure
			.input(z.object({ validate: z.boolean().optional() }).optional())
			.query(async ({ ctx, input }) => {
				if (!ctx.session || ctx.session == null) {
					return { data: null };
				}

				if (input?.validate) {
					const session = await ctx.db.query.sessions.findFirst({
						where: (sessions, { eq }) => eq(sessions.id, ctx.session!.id),
						with: {
							user: true,
						},
					});

					if (
						!session ||
						session.expiresAt < new Date() ||
						!session.user ||
						(session.user.bannedAt && !session.user.bannedUntil) ||
						(session.user.bannedAt && session.user.bannedUntil && session.user.bannedUntil < new Date())
					) {
						if (session) {
							await ctx.db.delete(schema.sessions).where(eq(schema.sessions.id, ctx.session.id));
						}

						cookies().set({
							...sessionCookieOptions,
							value: "",
						});

						return { data: null };
					}

					// SEE: ../../utils for why we don't include exp in the jwt.
					if (
						Math.floor(Date.now() / 1000) - ctx.session.iat > sessionJWTExpiry ||
						session.updatedAt > new Date(ctx.session.iat * 1000) ||
						session.user.updatedAt > new Date(ctx.session.iat * 1000)
					) {
						const newSession = {
							id: session.id,
							user: session.user,
						};
						const newSessionToken = await createSessionJWT(newSession);

						cookies().set({
							...sessionCookieOptions,
							value: newSessionToken,
						});

						const headersList = headers();

						if (
							session.ipAddress != ctx.request.ip ||
							session.userAgent !== headersList.get("user-agent") ||
							session.city != ctx.request.geo?.city ||
							session.country != ctx.request.geo?.country
						) {
							await ctx.db
								.update(sessions)
								.set({
									ipAddress: ctx.request.ip ?? session.ipAddress,
									userAgent: headersList.get("user-agent") || session.userAgent,
									city: ctx.request.geo?.city || session.city,
									country: ctx.request.geo?.country || session.country,
									lastActiveAt: new Date(),
								})
								.where(eq(sessions.id, session.id));
						} else {
							await ctx.db.update(sessions).set({ lastActiveAt: new Date() }).where(eq(sessions.id, session.id));
						}

						return {
							data: { ...newSession, iat: new Date().getTime(), nbf: new Date().getTime() } satisfies SessionCookie,
						};
					}
				}

				return { data: ctx.session };
			}),

		all: protectedProcedure.query(async ({ ctx }) => {
			const sessions = await ctx.db.query.sessions.findMany({
				where: (sessions, { eq }) => eq(sessions.userId, ctx.user.id),
				orderBy: (sessions, { desc }) => [desc(sessions.lastActiveAt), desc(sessions.createdAt), desc(sessions.id)],
				columns: {
					id: true,
					createdAt: true,
					expiresAt: true,
					city: true,
					country: true,
					ipAddress: true,
					userAgent: true,
					lastActiveAt: true,
				},
			});

			return { data: sessions };
		}),

		delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(sessions)
				.where(
					and(
						eq(organizations.id, ctx.user.organizationId),
						eq(sessions.id, input.id),
						eq(sessions.userId, ctx.user.id),
					),
				);
		}),
	}),

	delete: protectedProcedure.mutation(async ({ ctx }) => {
		if (ctx.user.organizationRole === "owner") {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You must transfer ownership of your organization before you can delete your account.",
			});
		}

		await ctx.db.delete(users).where(eq(users.id, ctx.user.id));
		await ctx.db.delete(sessions).where(eq(sessions.userId, ctx.user.id));
		await ctx.db.delete(organizationInviteLinks).where(eq(organizationInviteLinks.userId, ctx.user.id));

		cookies().set({
			...sessionCookieOptions,
			value: "",
		});
	}),

	signOut: protectedProcedure.mutation(async ({ ctx }) => {
		await ctx.db.delete(schema.sessions).where(eq(schema.sessions.id, ctx.session.id));

		cookies().set({
			...sessionCookieOptions,
			value: "",
		});
	}),
});
