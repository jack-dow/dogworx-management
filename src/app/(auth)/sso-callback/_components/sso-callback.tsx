"use client";

import * as React from "react";

import { Loader } from "~/components/ui/loader";
import { type SSOCallbackPageProps } from "~/app/(auth)/sso-callback/page";

function SSOCallback({ searchParams }: SSOCallbackPageProps) {
	return (
		<div
			role="status"
			aria-label="Loading"
			aria-describedby="loading-description"
			className="flex items-center justify-center"
		>
			<Loader className="mr-0 h-16 w-16" aria-hidden="true" variant="black" />
		</div>
	);
}

export { SSOCallback };
