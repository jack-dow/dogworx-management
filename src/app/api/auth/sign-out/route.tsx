import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { drizzle } from "~/db/drizzle";
import { sessions } from "~/db/schemas";
import { sessionCookieOptions, type SessionCookie } from "~/lib/auth-options";
import { jwt } from "~/lib/jwt";
import { type APIResponse } from "~/utils";

type SignOutPOSTResponse = APIResponse<undefined>;

async function POST(): Promise<NextResponse<SignOutPOSTResponse>> {
	const cookieStore = cookies();
	const sessionCookie = cookieStore.get(sessionCookieOptions.name);

	const sessionToken = sessionCookie?.value;

	try {
		if (sessionToken) {
			const sessionTokenData = (await jwt.verify(sessionToken)) as SessionCookie | null;

			if (sessionTokenData) {
				await drizzle.delete(sessions).where(eq(sessions.id, sessionTokenData.id));
			}
		}

		cookies().delete(sessionCookieOptions.name);

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
