import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sql } from "drizzle-orm";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import DogworxLogoGradient from "~/assets/dogworx-logo-gradient.svg";
import { drizzle } from "~/db/drizzle";
import { organizationInviteLinks } from "~/db/schema/auth";
import { server } from "~/lib/trpc/server";
import { InviteForm } from "./_components/invite-form";

export const metadata: Metadata = {
	title: "Invalid Invite | Dogworx Management",
};

async function InvitePage({ params }: { params: { id: string } }) {
	const response = await server.auth.organizations.inviteLinks.byId.query({ id: params.id });

	if (
		!response.data ||
		(response.data.maxUses && response.data.uses >= response.data.maxUses) ||
		response.data.createdAt.setSeconds(response.data.createdAt.getSeconds() + response.data.expiresAfter) <
			new Date().getTime()
	) {
		if (response.data) {
			if (
				(response.data.maxUses && response.data.uses >= response.data.maxUses) ||
				response.data.createdAt.setSeconds(response.data.createdAt.getSeconds() + response.data.expiresAfter) <
					new Date().getTime()
			) {
				await drizzle.delete(organizationInviteLinks).where(sql`BINARY ${organizationInviteLinks.id} = ${params.id}`);
			}
		}

		return (
			<>
				<div className="mb-8 flex w-full items-center justify-center">
					<Image src={DogworxLogoGradient as string} alt="Dogworx Logo (Gradient Version)" width={237} height={60} />
				</div>
				<Card className="w-full sm:max-w-lg">
					<CardHeader className="space-y-1 pb-4">
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
						<span className="font-semibold">{response.data.organization.name}</span> account
					</CardDescription>
				</CardHeader>

				<CardContent className="grid gap-4 px-6 pb-4">
					<InviteForm inviteLink={response.data} />
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

export default InvitePage;
