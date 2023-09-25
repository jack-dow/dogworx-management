import { headers as nextHeaders } from "next/headers";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";

import { getBaseUrl } from "~/lib/client-utils";
import { type AppRouter } from "~/server";

export const server = createTRPCProxyClient<AppRouter>({
	transformer: SuperJSON,
	links: [
		httpBatchLink({
			url: `${getBaseUrl()}/api/trpc`,
			// You can pass any HTTP headers you wish here
			headers() {
				const headers = new Map(nextHeaders());
				headers.set("x-trpc-source", "nextjs-react-server");
				return Object.fromEntries(headers);
			},
		}),
	],
	
});

export { type RouterInputs, type RouterOutputs } from "~/server";
