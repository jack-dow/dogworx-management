import { env } from "process";
import { NextResponse, type NextRequest } from "next/server";
import cryptoRandomString from "crypto-random-string";
import { VerificationCodeEmail } from "emails/verification-code-email";
import ms from "ms";
import { Resend } from "resend";
import { z } from "zod";

import { type APIResponse } from "~/app/api/_utils";
import { drizzle } from "~/db/drizzle";
import { verificationCodes } from "~/db/schema/auth";
import { generateId } from "~/lib/client-utils";
import { verifyAPISession } from "../../../utils";

const SendVerificationCodeBodySchema = z.object({
	emailAddress: z.string().email(),
});

type SendVerificationCodePOSTResponse = APIResponse<undefined, "NoUserEmailAddressFound">;

const resend = new Resend(env.RESEND_API_KEY);

async function POST(request: NextRequest): Promise<NextResponse<SendVerificationCodePOSTResponse>> {
	const body = (await request.json()) as unknown;

	const validation = SendVerificationCodeBodySchema.safeParse(body);

	if (!validation.success) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "InvalidBody",
					message: validation.error.issues,
				},
			},
			{ status: 400 },
		);
	}

	try {
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

		const { emailAddress } = validation.data;

		const code = cryptoRandomString({ length: 6, type: "numeric" });

		await drizzle.insert(verificationCodes).values({
			id: generateId(),
			emailAddress: emailAddress,
			code,
			expiresAt: new Date(Date.now() + ms("5m")),
		});

		await resend.sendEmail({
			from: "Dogworx Management <accounts@dogworx.com.au>",
			to: emailAddress,
			subject: `${code} is your verification code`,
			react: (
				<VerificationCodeEmail
					code={code}
					requestedFromIp={request.ip}
					requestedFromLocation={
						request.geo?.city && request.geo?.country ? `${request.geo?.city}, ${request.geo?.country}` : undefined
					}
				/>
			),
		});

		return NextResponse.json({ success: true });
	} catch (error) {
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

export { POST, type SendVerificationCodePOSTResponse };
