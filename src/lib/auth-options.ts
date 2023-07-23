import ms from "ms";

import { type User } from "~/server/db/schemas";
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
	signedInAs: string;
	user: User;
};

type SessionCookie = SessionCookiePayload & {
	iat: number;
	nbf: number;
};

async function createSessionJWT(payload: SessionCookiePayload) {
	const accessToken = await jwt.sign(payload);

	return accessToken;
}

export { type SessionCookiePayload, type SessionCookie, sessionCookieOptions, createSessionJWT };