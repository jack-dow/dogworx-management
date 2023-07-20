import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import DogworxLogoGradient from "~/assets/dogworx-logo-gradient.svg";
import { OAuthProviderButtons } from "./_components/oauth-provider-buttons";
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
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl">Sign in</CardTitle>
					<CardDescription>Choose your preferred sign in method</CardDescription>
				</CardHeader>

				<CardContent className="grid gap-4">
					<OAuthProviderButtons />

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">Or continue with</span>
						</div>
					</div>

					<SignInForm />
				</CardContent>

				<CardFooter className="flex flex-wrap items-center justify-between space-x-2">
					<div />
					<Link
						aria-label="Reset password"
						href="/sign-in/reset-password"
						className="text-sm text-primary underline-offset-4 transition-colors hover:underline"
					>
						Reset password
					</Link>
				</CardFooter>
			</Card>
		</>
	);
}

export default SignInPage;
