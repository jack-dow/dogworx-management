import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { organizationInviteLinks, organizations, sessions, users } from "~/db/schema/auth";
import { sessionCookieOptions } from "~/lib/auth-options";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const userRouter = createTRPCRouter({
	// Moved update to app/actions.ts due to a bug in TRPC where you can't set cookies on the response if you provide an .input() to a procedure

	// update: protectedProcedure.input(UpdateUserSchema.omit({ id: true })).mutation(async ({ ctx, input }) => {
	// 	await ctx.db
	// 		.update(users)
	// 		.set({ ...input, id: ctx.user.id })
	// 		.where(eq(users.id, ctx.user.id));

	// 	const newSessionToken = await createSessionJWT({
	// 		id: ctx.user.id,
	// 		user: {
	// 			...ctx.user,
	// 			...input,
	// 		},
	// 	});

	// 	ctx.cookies.set(sessionCookieOptions.name, newSessionToken, sessionCookieOptions);
	// }),

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
