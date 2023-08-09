import ms from "ms";

import { type SelectUserSchema } from "~/db/validation";
import { jwt } from "./jwt";

const sessionCookieOptions = {
	name: "__session",
	httpOnly: true,
	maxAge: ms("30d"),
	path: "/",
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
} as const;

type SessionCookiePayload = {
	id: string;
	user: SelectUserSchema;
};

type SessionCookie = SessionCookiePayload & {
	iat: number;
	nbf: number;
};

const sessionJWTExpiry = 900; // 15 minutes

async function createSessionJWT(payload: SessionCookiePayload) {
	const accessToken = await jwt.sign(payload);

	return accessToken;
}

export { type SessionCookiePayload, type SessionCookie, sessionCookieOptions, createSessionJWT, sessionJWTExpiry };
