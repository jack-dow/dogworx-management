import { NextResponse, type NextRequest } from "next/server";

import { server } from "./lib/trpc/server";

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const isAuthPage =
		pathname.startsWith("/sign-in") || pathname.startsWith("/invite") || pathname.startsWith("/verification-code");

	let from = pathname;
	if (request.nextUrl.search) {
		from += request.nextUrl.search;
	}

	const signInUrl = new URL(`/sign-in?from=${encodeURIComponent(from)}`, request.url);

	const { data: session } = await server.auth.user.sessions.current.query({ validate: true });

	if (!session && !isAuthPage) {
		return NextResponse.redirect(signInUrl);
	}

	if (session && (isAuthPage || pathname === "/")) {
		if (process.env.NODE_ENV !== "development") {
			return NextResponse.redirect(new URL("/calendar/week", request.url));
		} else {
			return NextResponse.redirect(new URL("/test", request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|static|favicon.ico|robots.txt).*)"],
};
