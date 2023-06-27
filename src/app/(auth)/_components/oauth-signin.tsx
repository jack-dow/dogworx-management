"use client";

import * as React from "react";
import { isClerkAPIResponseError, useSignIn } from "@clerk/nextjs";
import type { OAuthStrategy } from "@clerk/types";

import { Button } from "~/components/ui/button";
import { AppleIcon, GoogleIcon, type Icon } from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";

const oauthProviders = [
	{ name: "Google", strategy: "oauth_google", icon: GoogleIcon },
	{ name: "Apple", strategy: "oauth_apple", icon: AppleIcon },
] satisfies {
	name: string;
	icon: Icon;
	strategy: OAuthStrategy;
}[];

function OAuthSignIn() {
	const [isLoading, setIsLoading] = React.useState<OAuthStrategy | null>(null);
	const { signIn, isLoaded: signInLoaded } = useSignIn();
	const { toast } = useToast();

	async function oauthSignIn(provider: OAuthStrategy) {
		if (!signInLoaded) return null;
		try {
			setIsLoading(provider);
			await signIn.authenticateWithRedirect({
				strategy: provider,
				redirectUrl: "/sso-callback",
				redirectUrlComplete: "/",
			});
		} catch (error) {
			setIsLoading(null);

			const unknownError = "Something went wrong, please try again.";

			isClerkAPIResponseError(error)
				? toast({
						title: `Failed OAuth sign in`,
						description: error.errors[0]?.longMessage ?? unknownError,
				  })
				: toast({
						title: `An unknown error occurred`,
						description: unknownError,
				  });
		}
	}

	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
			{oauthProviders.map((provider) => {
				return (
					<Button
						aria-label={`Sign in with ${provider.name}`}
						key={provider.strategy}
						variant="outline"
						className="w-full bg-background sm:w-auto"
						onClick={() => void oauthSignIn(provider.strategy)}
					>
						{isLoading === provider.strategy ? (
							<Loader className="mr-2" variant="muted" size="sm" />
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

export { OAuthSignIn };
