import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { drizzle } from "~/db/drizzle";
import { users, verificationCodes } from "~/db/schema";
import { createSessionJWT, sessionCookieOptions } from "~/lib/auth-options";
import { type APIResponse } from "~/utils";
import { verifyAPISession } from "../../utils";

export const fetchCache = "force-no-store";

type VerifyNewEmailGETResponse = APIResponse<undefined, "Invalid" | "Expired">;

async function GET(request: NextRequest): Promise<NextResponse<VerifyNewEmailGETResponse>> {
	const { searchParams } = new URL(request.url);

	const code = searchParams.get("code");

	if (!code) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "Invalid",
					message: "No code was provided",
				},
			},
			{
				status: 400,
			},
		);
	}

	const verifiedSession = await verifyAPISession();

	if (!verifiedSession.success) {
		return NextResponse.json(
			{
				success: false,
				error: verifiedSession.error,
			},
			{
				status: verifiedSession.status,
			},
		);
	}

	const session = verifiedSession.data;

	try {
		const verificationCode = await drizzle.query.verificationCodes.findFirst({
			where: eq(verificationCodes.code, code),
		});

		if (!verificationCode) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "Invalid",
						message: "No code was provided",
					},
				},
				{
					status: 400,
				},
			);
		}

		await drizzle.delete(verificationCodes).where(eq(verificationCodes.id, verificationCode.id));

		if (verificationCode.expiresAt < new Date()) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "Expired",
						message: "The code provided has expired",
					},
				},
				{
					status: 400,
				},
			);
		}

		await drizzle
			.update(users)
			.set({
				emailAddress: verificationCode.emailAddress,
			})
			.where(eq(users.id, session.user.id));

		const newSessionToken = await createSessionJWT({
			id: session.id,
			user: {
				...session.user,
				emailAddress: verificationCode.emailAddress,
			},
		});

		cookies().set({
			...sessionCookieOptions,
			value: newSessionToken,
		});

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "UnknownError",
					message: "An unknown error occurred. Please try again.",
				},
			},
			{
				status: 500,
			},
		);
	}
}

export { GET, type VerifyNewEmailGETResponse };
