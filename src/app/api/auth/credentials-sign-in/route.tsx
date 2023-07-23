import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import argon2 from "argon2";
import { eq } from "drizzle-orm";

import { createSessionJWT, sessionCookieOptions } from "~/lib/auth-options";
import { generateId, type APIResponse } from "~/lib/utils";
import { CredentialsSignInSchema } from "~/lib/validation";
import { drizzle } from "~/server/db/drizzle";
import { providerAccounts, sessions } from "~/server/db/schemas";

export const fetchCache = "force-no-store";

async function verifyPassword(hash: string, password: string) {
	return argon2.verify(hash, password);
}

type CredentialsSignInPOSTResponse = APIResponse<undefined, "InvalidCredentials">;

async function POST(request: NextRequest): Promise<NextResponse<CredentialsSignInPOSTResponse>> {
	const body = (await request.json()) as unknown;
	const headersList = headers();

	const validation = CredentialsSignInSchema.safeParse(body);

	if (!validation.success) {
		return NextResponse.json(
			{ success: false, error: { code: "InvalidBody", message: validation.error.issues } },
			{ status: 400 },
		);
	}

	try {
		const { emailAddress, password } = validation.data;

		const account = await drizzle.query.providerAccounts.findFirst({
			where: eq(providerAccounts.providerAccountId, emailAddress),
			with: {
				user: true,
			},
		});

		const errorMessage = "Credentials do not match our records";

		if (!account || !account.user.password) {
			return NextResponse.json(
				{ success: false, error: { code: "InvalidCredentials", message: errorMessage } },
				{ status: 400 },
			);
		}

		const passwordValid = await verifyPassword(account.user.password, password);

		if (!passwordValid) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "InvalidCredentials",
						message: errorMessage,
					},
				},
				{ status: 400 },
			);
		}

		account.user.password = null;

		const sessionToken = await createSessionJWT({ user: account.user, signedInAs: emailAddress });

		await drizzle.insert(sessions).values({
			id: generateId(),
			sessionToken,
			userId: account.user.id,
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

		return NextResponse.json({ success: true }, { status: 201 });
	} catch (error) {
		if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "UnknownError",
						message: error.message,
					},
				},
				{ status: 500 },
			);
		}
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

export { POST, type CredentialsSignInPOSTResponse };
