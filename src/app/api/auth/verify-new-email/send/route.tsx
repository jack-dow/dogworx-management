import { NextResponse, type NextRequest } from "next/server";
import cryptoRandomString from "crypto-random-string";
import VerificationCodeEmail from "emails/verification-code-email";
import ms from "ms";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { verificationCodes } from "~/db/schema";
import { resend } from "~/lib/resend";
import { generateId, type APIResponse } from "~/utils";
import { verifyAPISession } from "../../../utils";

const VerifyNewEmailSendBodySchema = z.object({
	emailAddress: z.string().email(),
});

type VerifyNewEmailSendPOSTResponse = APIResponse<undefined, "NoUserEmailAddressFound">;

async function POST(request: NextRequest): Promise<NextResponse<VerifyNewEmailSendPOSTResponse>> {
	const body = (await request.json()) as unknown;

	const validation = VerifyNewEmailSendBodySchema.safeParse(body);

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

export { POST, type VerifyNewEmailSendPOSTResponse };
