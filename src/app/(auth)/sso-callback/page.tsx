import type { HandleOAuthCallbackParams } from "@clerk/types";

import { SSOCallback } from "./_components/sso-callback";

export const runtime = "edge";

interface SSOCallbackPageProps {
	searchParams: HandleOAuthCallbackParams;
}

function SSOCallbackPage({ searchParams }: SSOCallbackPageProps) {
	return <SSOCallback searchParams={searchParams} />;
}

export { type SSOCallbackPageProps };
export default SSOCallbackPage;
