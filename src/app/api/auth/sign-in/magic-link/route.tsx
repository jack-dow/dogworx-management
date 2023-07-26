import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { drizzle } from "~/db/drizzle";
import { magicLinks, sessions } from "~/db/schemas";
import { createSessionJWT, sessionCookieOptions } from "~/lib/auth-options";
import { generateId } from "~/lib/utils";

export const fetchCache = "force-no-store";

async function GET(request: NextRequest) {
	const headersList = headers();
	const { searchParams } = new URL(request.url);

	const token = searchParams.get("token");
	const code = searchParams.get("code") ?? undefined;

	if (!token && !code) {
		return NextResponse.redirect(new URL("/sign-in", request.url), {
			status: 400,
		});
	}

	try {
		const magicLink = await drizzle.query.magicLinks.findFirst({
			where: (magicLinks, { eq, sql }) =>
				token ? sql`BINARY ${magicLinks.token} = ${token}` : eq(magicLinks.code, code!),
			with: {
				user: true,
			},
		});

		if (!magicLink) {
			return NextResponse.redirect(new URL("/sign-in", request.url), {
				status: 400,
			});
		}

		await drizzle.delete(magicLinks).where(eq(magicLinks.id, magicLink.id));

		if (magicLink.expiresAt < new Date()) {
			return NextResponse.redirect(new URL("/sign-in", request.url), {
				status: 400,
			});
		}

		const sessionToken = await createSessionJWT({
			user: magicLink.user,
		});

		await drizzle.insert(sessions).values({
			id: generateId(),
			sessionToken,
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

		return NextResponse.redirect(new URL("/dashboard", request.url));
	} catch (error) {
		console.log({ error });
		return NextResponse.redirect(new URL("/sign-in", request.url), {
			status: 500,
		});
	}
}

export { GET };
