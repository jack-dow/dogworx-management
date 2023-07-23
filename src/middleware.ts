import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { jwt } from "~/lib/jwt";
import { createSessionJWT, sessionCookieOptions, type SessionCookie } from "./lib/auth-options";
import { drizzle } from "./server/db/drizzle";
import { sessions } from "./server/db/schemas";

export async function middleware(request: NextRequest) {
	const sessionCookie = request.cookies.get(sessionCookieOptions.name);

	const sessionToken = sessionCookie?.value;

	const isAuthPage = request.nextUrl.pathname.startsWith("/sign-in") || request.nextUrl.pathname.startsWith("/invite");

	let from = request.nextUrl.pathname;
	if (request.nextUrl.search) {
		from += request.nextUrl.search;
	}

	const signInUrl = new URL(`/sign-in?from=${encodeURIComponent(from)}`, request.url);

	if (!sessionToken && !isAuthPage) {
		return NextResponse.redirect(signInUrl);
	}

	if (sessionToken) {
		const sessionTokenData = (await jwt.verify(sessionToken)) as SessionCookie | null;

		if (!sessionTokenData) {
			const response = NextResponse.redirect(signInUrl);
			response.cookies.set({
				...sessionCookieOptions,
				value: "",
				maxAge: 0,
			});

			return response;
		}

		const session = await drizzle.query.sessions.findFirst({
			where: (sessions, { eq }) => eq(sessions.sessionToken, sessionToken),
		});

		console.log(session);

		// If no session can be found with this session token, that means that this is a stolen token or the user has had their token stolen.
		// In either case, we should delete all sessions for this user and redirect them to the sign-in page.
		if (!session) {
			await drizzle.delete(sessions).where(eq(sessions.userId, sessionTokenData.user.id));

			const response = isAuthPage ? NextResponse.next() : NextResponse.redirect(signInUrl);

			response.cookies.set({
				...sessionCookieOptions,
				value: "",
				maxAge: 0,
			});

			return response;
		}

		if (session.expiresAt < new Date()) {
			await drizzle.delete(sessions).where(eq(sessions.sessionToken, sessionToken));

			const response = isAuthPage ? NextResponse.next() : NextResponse.redirect(signInUrl);

			response.cookies.set({
				...sessionCookieOptions,
				value: "",
				maxAge: 0,
			});

			return response;
		}

		const response = isAuthPage ? NextResponse.redirect(new URL("/dashboard", request.url)) : NextResponse.next();

		// SEE: ~/lib/jwt.ts for why we don't include exp in the jwt.
		// Check if the token is older than 900  seconds (15mins) and if so, create a new one and update the session in the database.
		if (Math.floor(Date.now() / 1000) - sessionTokenData.iat > 900) {
			const newSessionToken = await createSessionJWT({
				user: sessionTokenData.user,
				signedInAs: sessionTokenData.signedInAs,
			});

			await drizzle
				.update(sessions)
				.set({
					sessionToken: newSessionToken,
				})
				.where(eq(sessions.id, session.id));

			response.cookies.set({
				...sessionCookieOptions,
				value: newSessionToken,
			});
		}

		return response;
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/sign-in", "/invite/:path*"],
};
