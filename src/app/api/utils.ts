import { cookies } from "next/headers";

import { sessionCookieOptions, sessionJWTExpiry, type SessionCookie } from "~/lib/auth-options";
import { jwt } from "~/lib/jwt";

async function verifyAPISession() {
	const cookieStore = cookies();
	const sessionCookie = cookieStore.get(sessionCookieOptions.name);

	const sessionToken = sessionCookie?.value;
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

	const sessionTokenData = (await jwt.verify(sessionToken)) as SessionCookie;

	if (Math.floor(Date.now() / 1000) - sessionTokenData.iat > sessionJWTExpiry) {
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
		data: sessionTokenData,
	} as const;
}

export { verifyAPISession };
