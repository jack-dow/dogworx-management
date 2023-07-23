"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/api";
import { generateId } from "~/lib/utils";
import { type InsertOrganizationSchema } from "~/server/db/zod-validation";

// export const metadata: Metadata = {
// 	title: "Dashboard | Dogworx Management",
// };

function TempPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [isLoading, setIsLoading] = React.useState(false);

	if (process.env.NODE_ENV !== "development") {
		router.replace("/dashboard");
	}

	return (
		<>
			<PageHeader title="Dashboard" />
			<div className="flex flex-col space-y-4 ">
				<div className="flex shrink-0 items-center pb-3 pt-6">
					<Button
						disabled={isLoading}
						onClick={() => {
							setIsLoading(true);
							const inviteLinkId = generateId();
							const organizationId = generateId();

							const organization = {
								id: organizationId,
								name: "Dogworx Management",
								maxUsers: 1,
								actions: {
									organizationInviteLinks: {
										[inviteLinkId]: {
											type: "INSERT",
											payload: {
												id: inviteLinkId,
												organizationId: organizationId,
												expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
												maxUses: 1000,
												userId: generateId(),
												role: "owner",
											},
										},
									},
								},
							} satisfies InsertOrganizationSchema;

							api.organizations
								.insert(organization)
								.then((result) => {
									console.log({ result });
									if (result.success) {
										toast({
											title: "Organization created",
											description: `Organization with id "${result.data?.id}" created successfully`,
										});
									}
								})
								.catch((error) => {
									console.log(error);
									toast({
										title: "Error",
										description: "Error creating organization",
										variant: "destructive",
									});
								})
								.finally(() => {
									setIsLoading(false);
								});
						}}
					>
						{isLoading && <Loader className="mr-2 h-4 w-4" />}
						Create Test Organization & Invite Link
					</Button>
				</div>
			</div>
		</>
	);
}

export default TempPage;
