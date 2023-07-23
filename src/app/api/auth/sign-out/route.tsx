import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { sessionCookieOptions } from "~/lib/auth-options";
import { type APIResponse } from "~/lib/utils";
import { drizzle } from "~/server/db/drizzle";
import { sessions } from "~/server/db/schemas";

type SignOutPOSTResponse = APIResponse<undefined>;

async function POST(): Promise<NextResponse<SignOutPOSTResponse>> {
	const cookieStore = cookies();
	const sessionCookie = cookieStore.get(sessionCookieOptions.name);

	const sessionToken = sessionCookie?.value;

	try {
		if (sessionToken) {
			await drizzle.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
		}

		cookies().set({
			...sessionCookieOptions,
			value: "",
			maxAge: 0,
		});

		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "UnknownError",
					message: "An unknown error occurred",
				},
			},
			{ status: 500 },
		);
	}
}

export { POST, type SignOutPOSTResponse };