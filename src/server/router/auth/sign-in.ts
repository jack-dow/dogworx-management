import { cookies, headers } from "next/headers";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { type SendMagicLinkPOSTResponse } from "~/app/api/auth/emails/magic-link/route";
import { type SendVerificationCodePOSTResponse } from "~/app/api/auth/emails/verification-code/route";
import { schema } from "~/db/drizzle";
import { createSessionJWT, generateId, getBaseUrl, logInDevelopment, sessionCookieOptions } from "~/lib/utils";
import { createTRPCRouter, publicProcedure } from "../../trpc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const signInRouter = createTRPCRouter({
	magicLink: createTRPCRouter({
		send: publicProcedure.input(z.object({ emailAddress: z.string().email() })).mutation(async ({ input }) => {
			try {
				const response = await fetch(getBaseUrl() + "/api/auth/emails/magic-link", {
					method: "POST",
					body: JSON.stringify({ emailAddress: input.emailAddress }),
				});
				const body = (await response.json()) as SendMagicLinkPOSTResponse;

				if (!body.success) {
					if (body.error.code === "NoUserFound") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "User not found",
						});
					}
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Error sending magic link",
					});
				}
			} catch (error) {
				logInDevelopment(error);

				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Error sending magic link",
				});
			}

			// ----------------------------------------------------------------------------------------------
			// Had to move this into API routes to due issues with react-email and next.js/trpc being on the edge.
			// The resend/react-email team have said they are working on a fix so hopefully this can be moved back into the router soon.
			// SEE: https://github.com/resendlabs/react-email/issues/871
			// ----------------------------------------------------------------------------------------------
			// const resend = new Resend(env.RESEND_API_KEY);
			// const { emailAddress } = input;
			// const user = await ctx.db.query.users.findFirst({
			// 	where: (users, { eq }) => eq(users.emailAddress, emailAddress),
			// 	columns: {
			// 		emailAddress: true,
			// 	},
			// });
			// if (!user) {
			// 	throw new TRPCError({
			// 		code: "NOT_FOUND",
			// 		message: "User not found",
			// 	});
			// }
			// const code = cryptoRandomString({ length: 6, type: "numeric" });
			// const token = cryptoRandomString({ length: 64, type: "url-safe" });
			// await ctx.db.insert(schema.verificationCodes).values({
			// 	id: generateId(),
			// 	emailAddress: user.emailAddress,
			// 	code,
			// 	token,
			// 	expiresAt: new Date(Date.now() + ms("5m")),
			// });
			// const html = await renderAsync(
			// 	React.createElement(MagicLinkEmail, {
			// 		code,
			// 		token,
			// 		requestedFromIp: ctx.request.ip,
			// 		requestedFromLocation:
			// 			ctx.request.geo?.city && ctx.request.geo?.country
			// 				? `${ctx.request.geo?.city}, ${ctx.request.geo?.country}`
			// 				: undefined,
			// 	}),
			// );
			// await resend.sendEmail({
			// 	to: emailAddress,
			// 	from: "Dogworx Management <accounts@dogworx.com.au>",
			// 	subject: `Your Dogworx Management Login`,
			// 	html,
			// });
		}),

		validate: publicProcedure.input(z.object({ token: z.string() })).mutation(async ({ ctx, input }) => {
			const magicLink = await ctx.db.query.verificationCodes.findFirst({
				where: (verificationCodes, { sql }) => sql`BINARY ${verificationCodes.token} = ${input.token}`,
				with: {
					user: true,
				},
			});

			if (!magicLink) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Magic link not found",
				});
			}

			if (magicLink?.user?.emailAddress.toLowerCase() !== "test@dogworx.com.au") {
				await ctx.db.delete(schema.verificationCodes).where(eq(schema.verificationCodes.id, magicLink.id));
			}

			if (magicLink.expiresAt < new Date()) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Magic link expired",
				});
			}

			if (!magicLink.user) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "User not found",
				});
			}

			const headersList = headers();
			const sessionId = generateId();

			const sessionToken = await createSessionJWT({
				id: sessionId,
				user: magicLink.user,
			});

			await ctx.db.insert(schema.sessions).values({
				id: sessionId,
				userId: magicLink.user.id,
				expiresAt: new Date(Date.now() + sessionCookieOptions.maxAge),
				ipAddress: ctx.request.ip,
				userAgent: headersList.get("user-agent"),
				city: ctx.request.geo?.city,
				country: ctx.request.geo?.country,
			});

			cookies().set({
				...sessionCookieOptions,
				value: sessionToken,
			});
		}),
	}),

	verificationCode: createTRPCRouter({
		send: publicProcedure.input(z.object({ emailAddress: z.string().email() })).mutation(async ({ input }) => {
			try {
				// ----------------------------------------------------------------------------------------------
				// Had to move this into API routes to due issues with react-email and next.js/trpc being on the edge.
				// The resend/react-email team have said they are working on a fix so hopefully this can be moved back into the router soon.
				// SEE: https://github.com/resendlabs/react-email/issues/871
				// ----------------------------------------------------------------------------------------------
				const response = await fetch(getBaseUrl() + "/api/auth/emails/verification-code", {
					method: "POST",
					body: JSON.stringify({ emailAddress: input.emailAddress }),
				});
				const body = (await response.json()) as SendVerificationCodePOSTResponse;

				if (!body.success) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Error sending magic link",
					});
				}
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Error sending magic link",
				});
			}
		}),

		validate: publicProcedure.input(z.object({ code: z.string() })).mutation(async ({ ctx, input }) => {
			const verificationCode = await ctx.db.query.verificationCodes.findFirst({
				where: (verificationCodes, { eq }) => eq(verificationCodes.code, input.code),
				with: {
					user: true,
				},
			});

			if (!verificationCode) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Verification code not found",
				});
			}

			if (!verificationCode.user) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "User not found",
				});
			}

			if (verificationCode?.user?.emailAddress.toLowerCase() !== "test@dogworx.com.au") {
				await ctx.db.delete(schema.verificationCodes).where(eq(schema.verificationCodes.id, verificationCode.id));
			}

			if (verificationCode.expiresAt < new Date()) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Verification code expired",
				});
			}

			const sessionId = generateId();

			const sessionToken = await createSessionJWT({
				id: sessionId,
				user: verificationCode.user,
			});

			await ctx.db.insert(schema.sessions).values({
				id: sessionId,
				userId: verificationCode.user.id,
				expiresAt: new Date(Date.now() + sessionCookieOptions.maxAge),
				ipAddress: ctx.request.headers.get("x-forwarded-for"),
				userAgent: ctx.request.headers.get("user-agent"),
			});

			cookies().set({
				...sessionCookieOptions,
				value: sessionToken,
			});
		}),
	}),
});
