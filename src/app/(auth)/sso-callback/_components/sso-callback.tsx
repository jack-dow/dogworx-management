"use client";

import * as React from "react";
import { useClerk } from "@clerk/nextjs";

import { Loader } from "~/components/ui/loader";
import { type SSOCallbackPageProps } from "~/app/(auth)/sso-callback/page";

function SSOCallback({ searchParams }: SSOCallbackPageProps) {
	const { handleRedirectCallback } = useClerk();

	React.useEffect(() => {
		void handleRedirectCallback(searchParams);
	}, [searchParams, handleRedirectCallback]);

	return (
		<div
			role="status"
			aria-label="Loading"
			aria-describedby="loading-description"
			className="flex items-center justify-center"
		>
			<Loader className="h-16 w-16" aria-hidden="true" />
		</div>
	);
}

export { SSOCallback };
