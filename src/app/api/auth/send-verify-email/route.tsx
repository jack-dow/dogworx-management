import { NextResponse, type NextRequest } from "next/server";
import cryptoRandomString from "crypto-random-string";
import VerifyEmailEmail from "emails/verify-email-email";
import { z } from "zod";

import { resend } from "~/lib/resend";
import { drizzle } from "~/server/db/drizzle";
import { verificationTokens } from "~/server/db/schemas";

const EmailBodySchema = z.object({
	emailAddress: z.string().email(),
});

async function POST(request: NextRequest) {
	const body = (await request.json()) as unknown;

	const parsedBody = EmailBodySchema.safeParse(body);

	if (!parsedBody.success) {
		return NextResponse.json(parsedBody.error.issues, { status: 400 });
	}

	const { emailAddress } = parsedBody.data;

	const validationCode = cryptoRandomString({ length: 6, type: "numeric" });

	await drizzle.insert(verificationTokens).values({
		identifier: emailAddress,
		token: validationCode,
		expires: new Date(Date.now() + 1000 * 60 * 5),
	});

	await resend.sendEmail({
		from: "Dogworx Hydrotherapy <accounts@dogworx.com.au>",
		to: email,
		subject: `${validationCode} is your Dogworx Hydrotherapy verification code`,
		react: (
			<VerifyEmailEmail
				validationCode={validationCode}
				requestedFromIp={request.ip}
				requestedFromLocation={
					request.geo?.city && request.geo?.country ? `${request.geo?.city}, ${request.geo?.country}` : undefined
				}
			/>
		),
	});
}

export { POST };
