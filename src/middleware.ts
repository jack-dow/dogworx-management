import { NextResponse, type NextRequest } from "next/server";

import { server } from "./lib/trpc/server";
import { sessionCookieOptions } from "./lib/utils";

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const isAuthPage =
		pathname.startsWith("/sign-in") || pathname.startsWith("/invite") || pathname.startsWith("/verification-code");

	let from = pathname;
	if (request.nextUrl.search) {
		from += request.nextUrl.search;
	}

	const signInUrl = new URL(`/sign-in?from=${encodeURIComponent(from)}`, request.url);

	const { data: session, token } = await server.auth.user.sessions.current.query({ validate: true });

	if (!session && !isAuthPage) {
		return NextResponse.redirect(signInUrl);
	}

	const response =
		session && (isAuthPage || pathname === "/")
			? process.env.NODE_ENV !== "development"
				? NextResponse.redirect(new URL("/calendar/week", request.url))
				: NextResponse.redirect(new URL("/test", request.url))
			: NextResponse.next();

	if (token) {
		response.cookies.set({
			...sessionCookieOptions,
			value: token,
		});
	}

	return response;
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|static|favicon.ico|robots.txt).*)"],
};
