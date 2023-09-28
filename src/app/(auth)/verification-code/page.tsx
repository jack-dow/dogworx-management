import { type Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import DogworxLogoGradient from "~/assets/dogworx-logo-gradient.svg";
import { type SearchParams } from "~/lib/utils";
import { AuthVerificationCodeInput } from "./_components/auth-verification-code-input";

export const metadata: Metadata = {
	title: "Sign In | Dogworx Management",
};

const SearchParamsSchema = z.object({
	emailAddress: z.string().email().optional().catch(undefined),
	from: z.string().optional().catch(undefined),
});

function VerificationCodePage(props: { searchParams?: SearchParams }) {
	const searchParams = SearchParamsSchema.parse(props.searchParams);

	if (!searchParams?.emailAddress) {
		redirect("/sign-in");
	}

	return (
		<>
			<div className="mb-8 flex w-full items-center justify-center">
				<Image src={DogworxLogoGradient as string} alt="Dogworx Logo (Gradient Version)" width={237} height={60} />
			</div>
			<Card className="w-full sm:max-w-lg">
				<CardHeader className="space-y-1 pb-4">
					<CardTitle className="text-2xl">Verify email address</CardTitle>
					<CardDescription>
						We&apos;ve sent a verification code to <span className="font-medium">{searchParams.emailAddress}</span>.
						Enter the code below to verify your email address.
					</CardDescription>
				</CardHeader>

				<CardContent className="grid gap-4">
					<AuthVerificationCodeInput />
				</CardContent>
			</Card>
		</>
	);
}

export default VerificationCodePage;
