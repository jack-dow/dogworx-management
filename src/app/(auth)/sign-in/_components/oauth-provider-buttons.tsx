"use client";

import * as React from "react";
import { redirect, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "~/components/ui/button";
import { GoogleIcon } from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";

type OAuthStrategy = "google";

const OAuthProviders = [
	{ name: "Google", strategy: "google", icon: GoogleIcon },
	// { name: "Apple", strategy: "oauth_apple", icon: AppleIcon },
] satisfies {
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: (...args: any[]) => JSX.Element;
	strategy: OAuthStrategy;
}[];

function OAuthProviderButtons() {
	const [isLoading, setIsLoading] = React.useState<OAuthStrategy | null>(null);
	const { toast } = useToast();
	const searchParams = useSearchParams();

	async function oauthSignIn(provider: OAuthStrategy) {
		setIsLoading(provider);

		const response = await signIn(provider, {
			callbackUrl: searchParams?.get("from") || "/dashboard",
		});

		console.log({ response });

		if (response?.ok) {
			redirect(response.url ?? "/");
		}

		if (response?.error) {
			console.log("error!", response.error);
			toast({
				title: `An unknown error occurred`,
				description: "Something went wrong, please try again.",
			});
		}

		// try {

		// } catch (error) {
		// 	setIsLoading(null);

		// 	const unknownError = "Something went wrong, please try again.";

		// 	toast({
		// 		title: `An unknown error occurred`,
		// 		description: unknownError,
		// 	});
		// }
	}

	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-1 sm:gap-4">
			{OAuthProviders.map((provider) => {
				return (
					<Button
						aria-label={`Sign in with ${provider.name}`}
						key={provider.strategy}
						variant="outline"
						className="w-full bg-background sm:w-auto"
						onClick={() => void oauthSignIn(provider.strategy)}
					>
						{isLoading === provider.strategy ? (
							<Loader variant="muted" size="sm" />
						) : (
							<provider.icon className="mr-2 h-4 w-4" aria-hidden="true" />
						)}
						{provider.name}
					</Button>
				);
			})}
		</div>
	);
}

export { OAuthProviderButtons, OAuthProviders };
