import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { drizzle } from "~/db/drizzle";
import { sessions, verificationCodes } from "~/db/schema/auth";
import { createSessionJWT, sessionCookieOptions } from "~/lib/auth-options";
import { generateId } from "~/lib/utils";

export const fetchCache = "force-no-store";

async function GET(request: NextRequest) {
	const headersList = headers();
	const { searchParams } = new URL(request.url);

	const token = searchParams.get("token");

	if (!token) {
		return NextResponse.redirect(new URL("/sign-in?ref=magic-link", request.url), {
			status: 303,
		});
	}

	try {
		const magicLink = await drizzle.query.verificationCodes.findFirst({
			where: (verificationCodes, { sql }) => sql`BINARY ${verificationCodes.token} = ${token}`,
			with: {
				user: true,
			},
		});

		if (!magicLink) {
			return NextResponse.redirect(new URL("/sign-in?ref=magic-link", request.url), {
				status: 303,
			});
		}

		if (magicLink?.user?.emailAddress.toLowerCase() !== "test@dogworx.com.au") {
			await drizzle.delete(verificationCodes).where(eq(verificationCodes.id, magicLink.id));
		}

		if (magicLink.expiresAt < new Date()) {
			return NextResponse.redirect(new URL("/sign-in?ref=magic-link", request.url), {
				status: 303,
			});
		}

		if (!magicLink.user) {
			return NextResponse.redirect(new URL("/sign-in?ref=magic-link", request.url), {
				status: 303,
			});
		}

		const sessionId = generateId();

		const sessionToken = await createSessionJWT({
			id: sessionId,
			user: magicLink.user,
		});

		await drizzle.insert(sessions).values({
			id: sessionId,
			userId: magicLink.user.id,
			expiresAt: new Date(Date.now() + sessionCookieOptions.maxAge),
			ipAddress: request.ip,
			userAgent: headersList.get("user-agent"),
			city: request.geo?.city,
			country: request.geo?.country,
		});

		cookies().set({
			...sessionCookieOptions,
			value: sessionToken,
		});

		return NextResponse.redirect(new URL("/", request.url));
	} catch {
		return NextResponse.redirect(new URL("/sign-in", request.url), {
			status: 500,
		});
	}
}

export { GET };
