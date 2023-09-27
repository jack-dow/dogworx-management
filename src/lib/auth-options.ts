import { type ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { type InferSelectModel } from "drizzle-orm";
import ms from "ms";

import { type users } from "~/db/schema/auth";
import { jwt } from "./jwt";

const sessionCookieOptions = {
	name: "__session",
	httpOnly: true,
	maxAge: ms("30d"),
	path: "/",
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
} satisfies Partial<ResponseCookie>;

type SessionCookiePayload = {
	id: string;
	user: InferSelectModel<typeof users>;
};

type SessionCookie = SessionCookiePayload & {
	iat: number;
	nbf: number;
};

const sessionJWTExpiry = 60; // 1 minute

async function createSessionJWT(payload: SessionCookiePayload) {
	const accessToken = await jwt.sign(payload);

	return accessToken;
}

export { type SessionCookiePayload, type SessionCookie, sessionCookieOptions, createSessionJWT, sessionJWTExpiry };
