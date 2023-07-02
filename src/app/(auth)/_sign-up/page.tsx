import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { OAuthSignIn } from "../_components/oauth-signin";
import { SignUpForm } from "./_components/sign-up-form";

export const metadata: Metadata = {
	title: "Sign Up | Dogworx Management",
};

function SignUpPage() {
	return (
		<>
			<div className="mb-8 flex w-full items-center justify-center">
				<Image src="/dogworx-logo-full.svg" alt="Dogworx Logo Full" width={237} height={60} />
			</div>
			<Card className="w-full sm:max-w-lg">
				<CardHeader className="space-y-1">
					{/* <div className="mb-6  flex w-full items-center justify-center">
						<Image src="/dogworx-logo-full.svg" alt="Dogworx Logo Full" width={237} height={60} />
					</div> */}
					<CardTitle className="text-2xl">Sign up</CardTitle>
					<CardDescription>Choose your preferred sign up method</CardDescription>
				</CardHeader>

				<CardContent className="grid gap-4">
					<OAuthSignIn />

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">Or continue with</span>
						</div>
					</div>

					<SignUpForm />
				</CardContent>

				<CardFooter className="grid gap-4">
					<div className="text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							aria-label="Sign in"
							href="/sign-in"
							className="text-primary underline-offset-4 transition-colors hover:underline"
						>
							Sign in
						</Link>
					</div>
				</CardFooter>
			</Card>
		</>
	);
}

export default SignUpPage;
