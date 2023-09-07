import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { jwt } from "~/lib/jwt";
import { drizzle } from "./db/drizzle";
import { sessions } from "./db/schema";
import { createSessionJWT, sessionCookieOptions, sessionJWTExpiry, type SessionCookie } from "./lib/auth-options";

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

			response.cookies.delete(sessionCookieOptions.name);

			return response;
		}

		// SEE: ~/lib/jwt.ts for why we don't include exp in the jwt.
		if (Math.floor(Date.now() / 1000) - sessionTokenData.iat > sessionJWTExpiry) {
			const session = await drizzle.query.sessions.findFirst({
				where: (sessions, { eq }) => eq(sessions.id, sessionTokenData.id),
				with: {
					user: {
						columns: {
							id: true,
							bannedAt: true,
							bannedUntil: true,
						},
					},
				},
			});

			if (
				!session ||
				session.expiresAt < new Date() ||
				!session.user ||
				(session.user.bannedAt && !session.user.bannedUntil) ||
				(session.user.bannedAt && session.user.bannedUntil && session.user.bannedUntil < new Date())
			) {
				if (session) {
					await drizzle.delete(sessions).where(eq(sessions.id, sessionTokenData.id));
				}

				const response = isAuthPage ? NextResponse.next() : NextResponse.redirect(signInUrl);

				response.cookies.delete(sessionCookieOptions.name);

				return response;
			}

			const response = isAuthPage ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
			const requestHeaders = new Headers(request.headers);

			// SEE: ~/lib/jwt.ts for why we don't include exp in the jwt.
			const newSessionToken = await createSessionJWT({
				id: sessionTokenData.id,
				user: sessionTokenData.user,
			});

			if (
				session.ipAddress != request.ip ||
				session.userAgent !== requestHeaders.get("user-agent") ||
				session.city != request.geo?.city ||
				session.country != request.geo?.country
			) {
				await drizzle
					.update(sessions)
					.set({
						ipAddress: request.ip ?? session.ipAddress,
						userAgent: requestHeaders.get("user-agent") || session.userAgent,
						city: request.geo?.city || session.city,
						country: request.geo?.country || session.country,
					})
					.where(eq(sessions.id, session.id));
			} else {
				await drizzle.update(sessions).set({ updatedAt: new Date() }).where(eq(sessions.id, session.id));
			}

			response.cookies.set({
				...sessionCookieOptions,
				value: newSessionToken,
			});

			return response;
		}

		// Valid JWT that hasn't expired yet but user is on auth page, redirect to dashboard page
		if (isAuthPage) {
			return NextResponse.redirect(new URL("/", request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|static|favicon.ico|robots.txt).*)"],
};
