import { NextResponse, type NextRequest } from "next/server";
import cryptoRandomString from "crypto-random-string";
import MagicLinkEmail from "emails/magic-link-email";
import ms from "ms";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { verificationCodes } from "~/db/schemas";
import { resend } from "~/lib/resend";
import { generateId, type APIResponse } from "~/utils";

const SendMagicLinkBodySchema = z.object({
	emailAddress: z.string().email(),
});

type SendMagicLinkPOSTResponse = APIResponse<undefined, "NoUserEmailAddressFound">;

async function POST(request: NextRequest): Promise<NextResponse<SendMagicLinkPOSTResponse>> {
	const body = (await request.json()) as unknown;

	const validation = SendMagicLinkBodySchema.safeParse(body);

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
		const { emailAddress } = validation.data;

		const user = await drizzle.query.users.findFirst({
			where: (users, { eq }) => eq(users.emailAddress, emailAddress),
			columns: {
				emailAddress: true,
			},
		});

		if (!user) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "NoUserEmailAddressFound",
						message: "No user with that email address exists",
					},
				},
				{ status: 404 },
			);
		}

		const code = cryptoRandomString({ length: 6, type: "numeric" });
		const token = cryptoRandomString({ length: 64, type: "url-safe" });

		await drizzle.insert(verificationCodes).values({
			id: generateId(),
			emailAddress: user.emailAddress,
			code,
			token,
			expiresAt: new Date(Date.now() + ms("5m")),
		});

		await resend.sendEmail({
			from: "Dogworx Management <accounts@dogworx.com.au>",
			to: emailAddress,
			subject: `Your Dogworx Management Login`,
			react: (
				<MagicLinkEmail
					code={code}
					token={token}
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

export { POST, type SendMagicLinkPOSTResponse };
