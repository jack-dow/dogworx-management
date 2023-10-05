"use client";

// -----------------------------------------------------------------------------
// This file exists because Providers must be exported from a client component
// -----------------------------------------------------------------------------
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import { httpBatchLink, loggerLink, splitLink, unstable_httpBatchStreamLink } from "@trpc/client";
import superjson from "superjson";

import { env } from "~/env.mjs";
import { api } from "~/lib/trpc/client";
import { type SessionCookie } from "~/lib/utils";

type ProviderProps<Props = undefined> = Props extends undefined
	? {
			children: React.ReactNode;
	  }
	: { children: React.ReactNode } & Props;

const getBaseUrl = () => {
	if (typeof window !== "undefined") return ""; // browser should use relative url
	if (env.VERCEL_URL) return env.VERCEL_URL; // SSR should use vercel url

	return `http://localhost:${env.PORT}`; // dev SSR should use localhost
};

export function TRPCReactProvider(props: { children: React.ReactNode; headers: Headers }) {
	const [queryClient] = React.useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 1000,
					},
				},
			}),
	);

	const [trpcClient] = React.useState(() =>
		api.createClient({
			transformer: superjson,
			links: [
				loggerLink({
					enabled: (opts) =>
						process.env.NODE_ENV === "development" || (opts.direction === "down" && opts.result instanceof Error),
				}),
				splitLink({
					condition(op) {
						// Add logic here to return true for paths/routes that need to set cookies
						return op.path.startsWith("auth.");
					},
					true: httpBatchLink({
						url: `${getBaseUrl()}/api/trpc`,
						headers() {
							const heads = new Map(props.headers);
							heads.set("x-trpc-source", "react-no-stream");
							return Object.fromEntries(heads);
						},
					}),
					false: unstable_httpBatchStreamLink({
						url: `${getBaseUrl()}/api/trpc`,
						headers() {
							const heads = new Map(props.headers);
							heads.set("x-trpc-source", "react-stream");
							return Object.fromEntries(heads);
						},
					}),
				}),
			],
		}),
	);

	return (
		<api.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<ReactQueryStreamedHydration transformer={superjson}>{props.children}</ReactQueryStreamedHydration>
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</api.Provider>
	);
}

// -----------------------------------------------------------------------------
// Session Context
// -----------------------------------------------------------------------------
type SessionContextProps = {
	session: SessionCookie;
};

const SessionContext = React.createContext<SessionContextProps | null>(null);

function useSessionContext() {
	const context = React.useContext(SessionContext);

	if (!context) {
		throw new Error("useSessionContext must be used within a SessionProvider");
	}

	return context;
}

export function useSession() {
	const context = useSessionContext();

	context.session.user.createdAt = new Date(context.session.user.createdAt);
	context.session.user.updatedAt = new Date(context.session.user.updatedAt);

	return context.session;
}

/**
 * Hook for easily accessing the user object within a session.
 */
export function useUser() {
	const session = useSession();

	session.user.createdAt = new Date(session.user.createdAt);
	session.user.updatedAt = new Date(session.user.updatedAt);

	return session.user;
}

export const SessionProvider = ({ children, session }: ProviderProps<{ session: SessionCookie }>) => {
	const [_session, setSession] = React.useState<SessionCookie>(session);

	React.useEffect(() => {
		setSession(session);
	}, [session]);

	return <SessionContext.Provider value={{ session: _session }}>{children}</SessionContext.Provider>;
};
