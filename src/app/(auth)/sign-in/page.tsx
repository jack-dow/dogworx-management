import { type Metadata } from "next";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import DogworxLogoGradient from "~/assets/dogworx-logo-gradient.svg";
import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
	title: "Sign In | Dogworx Management",
};

function SignInPage() {
	return (
		<>
			<div className="mb-8 flex w-full items-center justify-center">
				<Image src={DogworxLogoGradient as string} alt="Dogworx Logo (Gradient Version)" width={237} height={60} />
			</div>
			<Card className="w-full sm:max-w-lg">
				<CardHeader className="space-y-1 pb-4">
					<CardTitle className="text-2xl">Sign in</CardTitle>
					<CardDescription>Enter your email address to sign in to your account.</CardDescription>
				</CardHeader>

				<CardContent className="grid gap-4">
					<SignInForm />
				</CardContent>
			</Card>
		</>
	);
}

export default SignInPage;
