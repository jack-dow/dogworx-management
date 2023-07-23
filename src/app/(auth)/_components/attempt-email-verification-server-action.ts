"use server";

import { and, eq } from "drizzle-orm";

import { drizzle } from "~/server/db/drizzle";
import { verificationTokens } from "~/server/db/schemas";

async function attemptEmailVerification({ email, verificationCode }: { email: string; verificationCode: string }) {
	const correctVerificationCode = await drizzle.query.verificationTokens.findFirst({
		where: and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, verificationCode)),
	});

	if (!correctVerificationCode) {
		return {
			success: false,
			title: "Invalid verification code",
			description: "The verification code you entered is incorrect. Please try again.",
		};
	}

	await drizzle
		.delete(verificationTokens)
		.where(and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, verificationCode)));

	if (correctVerificationCode?.expires < new Date()) {
		return {
			success: false,
			title: "Verification code has expired",
			description:
				"The verification code you entered has expired. Email verification codes are only valid for 5 minutes. Please try again.",
		};
	}

	return {
		success: true,
		title: "Successfully verified email",
		description: "Your email address has been successfully verified.",
	};
}

export { attemptEmailVerification };
