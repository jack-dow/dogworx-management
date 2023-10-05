import { cookies } from "next/headers";
import { type z } from "zod";

import { jwt, sessionCookieOptions, sessionJWTExpiry, type SessionCookie } from "~/lib/utils";

export async function verifyAPISession() {
	const cookieStore = cookies();
	const sessionCookie = cookieStore.get(sessionCookieOptions.name);

	const sessionToken = sessionCookie?.value;

	console.log(sessionToken);
	if (!sessionToken) {
		return {
			success: false,
			error: {
				code: "NotAuthorized",
				message: "You are not authorized to perform this action",
			},
			status: 401,
		} as const;
	}

	const session = (await jwt.verify(sessionToken)) as SessionCookie;

	if (
		(Math.floor(Date.now() / 1000) - session.iat > sessionJWTExpiry,
		!session ||
			!session.user ||
			(session.user.bannedAt && !session.user.bannedUntil) ||
			(session.user.bannedAt && session.user.bannedUntil && session.user.bannedUntil < new Date()))
	) {
		return {
			success: false,
			error: {
				code: "NotAuthorized",
				message: "You are not authorized to perform this action",
			},
			status: 401,
		} as const;
	}

	return {
		success: true,
		data: session,
	} as const;
}

type DefaultErrorCodes = "InvalidBody" | "UnknownError" | "NotAuthorized";

export type APIResponse<Data, ErrorCodes extends string | undefined = undefined> =
	| (Data extends undefined ? { success: true; error?: never } : { success: true; data: Data; error?: never })
	| {
			success: false;
			error: {
				code: ErrorCodes extends undefined ? DefaultErrorCodes : DefaultErrorCodes | ErrorCodes;
				message: string | z.ZodIssue[];
			};
			data?: never;
	  };
