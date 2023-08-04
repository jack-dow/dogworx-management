import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { jwt } from "~/lib/jwt";
import { drizzle } from "./db/drizzle";
import { sessions } from "./db/schemas";
import { createSessionJWT, sessionCookieOptions, sessionJWTExpiry, type SessionCookie } from "./lib/auth-options";

export async function middleware(request: NextRequest) {
	// if (process.env.NODE_ENV === "development") {
	// 	return NextResponse.next();
	// }

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

		const response = isAuthPage ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
		const requestHeaders = new Headers(request.headers);

		// SEE: ~/lib/jwt.ts for why we don't include exp in the jwt.
		if (Math.floor(Date.now() / 1000) - sessionTokenData.iat > sessionJWTExpiry) {
			const newSessionToken = await createSessionJWT({
				id: sessionTokenData.id,
				createdAt: sessionTokenData.createdAt,
				updatedAt: new Date(),
				user: sessionTokenData.user,
			});

			await drizzle
				.update(sessions)
				.set({
					sessionToken: newSessionToken,
					ipAddress: request.ip,
					userAgent: requestHeaders.get("user-agent"),
					city: request.geo?.city,
					country: request.geo?.country,
				})
				.where(eq(sessions.id, session.id));

			response.cookies.set({
				...sessionCookieOptions,
				value: newSessionToken,
			});
		}

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
		}

		return response;
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|static|favicon.ico|robots.txt).*)"],
};
