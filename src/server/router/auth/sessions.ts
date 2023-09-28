import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { organizations, sessions } from "~/db/schema/auth";
import { env } from "~/env.mjs";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const sessionsRouter = createTRPCRouter({
	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		if (ctx.user.organizationRole === "member") {
			await ctx.db
				.delete(sessions)
				.where(
					and(
						eq(organizations.id, ctx.user.organizationId),
						eq(sessions.id, input.id),
						eq(sessions.userId, ctx.user.id),
					),
				);
			return;
		}

		const session = await ctx.db.query.sessions.findFirst({
			where: (sessions, { eq }) => eq(sessions.id, input.id),
			columns: {
				id: true,
				userId: true,
			},
			with: {
				user: {
					columns: {
						organizationId: true,
						organizationRole: true,
					},
				},
			},
		});

		if (
			!session ||
			(ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID &&
				session.user.organizationId !== ctx.user.organizationId) ||
			(ctx.user.organizationRole === "admin" && session.user.organizationRole !== "member")
		) {
			return;
		}

		await ctx.db.delete(sessions).where(eq(sessions.id, input.id));
	}),
});
