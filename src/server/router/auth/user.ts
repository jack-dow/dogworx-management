import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { organizationInviteLinks, organizations, sessions, users } from "~/db/schema/auth";
import { UpdateUserSchema } from "~/db/validation/auth";
import { createSessionJWT, sessionCookieOptions } from "~/lib/auth-options";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const userRouter = createTRPCRouter({
	update: protectedProcedure
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

			if (Object.keys(data).length > 0) {
				await ctx.db.update(users).set(input).where(eq(users.id, ctx.user.id));

				const newSessionToken = await createSessionJWT({
					id: ctx.user.id,
					user: {
						...ctx.user,
						...input,
					},
				});

				cookies().set({
					...sessionCookieOptions,
					value: newSessionToken,
				});
			}
		}),

	sessions: createTRPCRouter({
		current: protectedProcedure.query(({ ctx }) => {
			return ctx.session;
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
});
