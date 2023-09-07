import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { drizzle } from "~/db/drizzle";
import { sessions, verificationCodes } from "~/db/schema";
import { createSessionJWT, sessionCookieOptions } from "~/lib/auth-options";
import { generateId, type APIResponse } from "~/utils";

export const fetchCache = "force-no-store";

type SignInWithVerificationCodeGETResponse = APIResponse<undefined, "InvalidCode">;

async function GET(request: NextRequest): Promise<NextResponse<SignInWithVerificationCodeGETResponse>> {
	const headersList = headers();
	const { searchParams } = new URL(request.url);

	const code = searchParams.get("code");

	if (!code) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "InvalidCode",
					message: "You must provide a verification code.",
				},
			},
			{
				status: 400,
			},
		);
	}

	try {
		const verificationCode = await drizzle.query.verificationCodes.findFirst({
			where: (verificationCodes, { eq }) => eq(verificationCodes.code, code),
			with: {
				user: true,
			},
		});

		if (!verificationCode) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "InvalidCode",
						message: "The verification code you provided is invalid or expired. Please request a new one and try again",
					},
				},
				{
					status: 400,
				},
			);
		}

		if (verificationCode?.user?.emailAddress.toLowerCase() !== "test@dogworx.com.au") {
			await drizzle.delete(verificationCodes).where(eq(verificationCodes.id, verificationCode.id));
		}

		if (verificationCode.expiresAt < new Date()) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "InvalidCode",
						message: "The verification code you provided is invalid or expired. Please request a new one and try again",
					},
				},
				{
					status: 400,
				},
			);
		}

		const sessionId = generateId();

		const sessionToken = await createSessionJWT({
			id: sessionId,
			user: verificationCode.user,
		});

		await drizzle.insert(sessions).values({
			id: sessionId,
			userId: verificationCode.user.id,
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

		return NextResponse.json({
			success: true,
		});
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

export { GET, type SignInWithVerificationCodeGETResponse };
