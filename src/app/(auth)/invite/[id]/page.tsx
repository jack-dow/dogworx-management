import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/api";
import DogworxLogoGradient from "~/assets/dogworx-logo-gradient.svg";
import { SignUpForm } from "./_components/sign-up-form";

export const metadata: Metadata = {
	title: "Sign Up | Dogworx Management",
};

async function SignUpPage({ params }: { params: { id: string } }) {
	const inviteLink = await api.organizations.getInviteLink(params.id);

	if (!inviteLink.data) {
		return (
			<>
				<div className="mb-8 flex w-full items-center justify-center">
					<Image src={DogworxLogoGradient as string} alt="Dogworx Logo (Gradient Version)" width={237} height={60} />
				</div>
				<Card className="w-full sm:max-w-lg">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl">Invalid Invite</CardTitle>
						<CardDescription>
							This invite may have expired or is invalid. Please contact your organization owner for a new invite.
						</CardDescription>
					</CardHeader>

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

	return (
		<>
			<div className="mb-8 flex w-full items-center justify-center">
				<Image src={DogworxLogoGradient as string} alt="Dogworx Logo (Gradient Version)" width={237} height={60} />
			</div>
			<Card className="w-full sm:max-w-lg">
				<CardHeader className="space-y-1">
					{/* <div className="mb-6  flex w-full items-center justify-center">
						<DogworxLogoFull className="h-[60px] w-[237px]" />
					</div> */}
					<CardTitle className="text-2xl">Sign up</CardTitle>
					<CardDescription>
						Enter your details below to create your{" "}
						<span className="font-semibold">{inviteLink.data.organization.name}</span> account
					</CardDescription>
				</CardHeader>

				<CardContent className="grid gap-4">
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
