import * as React from "react";
import { isClerkAPIResponseError, useUser } from "@clerk/nextjs";

import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { PlusIcon } from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { OAuthProviders } from "~/app/(auth)/_components/oauth-sign-in";

function AddConnectedAccountDialog() {
	const { user } = useUser();
	const [isOpen, setIsOpen] = React.useState(false);
	const [isLoading, setIsLoading] = React.useState<(typeof OAuthProviders)[number]["name"] | null>(null);
	const { toast } = useToast();

	if (!user) return null;

	const remainingOAuthProviders = OAuthProviders.filter(
		(provider) =>
			!user.externalAccounts.some(
				(account) => `oauth_${account.provider}` === provider.strategy && account.verification?.status === "verified",
			),
	);

	if (remainingOAuthProviders.length < 1) {
		return null;
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button type="button" variant="ghost" className="-ml-4">
					<PlusIcon className="mr-2 h-4 w-4" /> Connect account
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Connect external account</DialogTitle>
					<DialogDescription>
						Connect your account to an external service to enable additional features.
					</DialogDescription>
				</DialogHeader>
				<div className="w-full space-y-4 ">
					{remainingOAuthProviders.map((provider) => (
						<Button
							variant="outline"
							className="w-full"
							key={provider.name}
							onClick={
								void (async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
									e.preventDefault();
									e.stopPropagation();

									try {
										setIsLoading(provider.name);
										await user.createExternalAccount({
											strategy: provider.strategy,
											redirectUrl: "/account-settings",
										});
									} catch (error) {
										setIsLoading(null);

										const unknownError = "Something went wrong, please try again.";

										isClerkAPIResponseError(error)
											? toast({
													title: `Failed OAuth connection`,
													description: error.errors[0]?.longMessage ?? unknownError,
											  })
											: toast({
													title: `An unknown error occurred`,
													description: unknownError,
											  });
									}
								})
							}
						>
							{isLoading === provider.name ? (
								<Loader size="sm" />
							) : (
								<provider.icon className="mr-2 h-4 w-4" aria-hidden="true" />
							)}
							{provider.name}
						</Button>
					))}
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							setIsOpen(false);
						}}
					>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { AddConnectedAccountDialog };
