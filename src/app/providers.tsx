"use client";

// -----------------------------------------------------------------------------
// This file exists because Providers must be exported from a client component
// -----------------------------------------------------------------------------
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import { httpBatchLink, loggerLink } from "@trpc/client";
import superjson from "superjson";

import { env } from "~/env.mjs";
import { type SessionCookie } from "~/lib/auth-options";
import { api } from "~/lib/trpc/client";
import { setTimezone } from "./actions";

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

export function TRPCReactProvider(props: { children: React.ReactNode; headers?: Headers }) {
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
				httpBatchLink({
					url: `${getBaseUrl()}/api/trpc`,
					headers() {
						const headers = new Map(props.headers);
						headers.set("x-trpc-source", "nextjs-react-client");
						return Object.fromEntries(headers);
					},
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

// -----------------------------------------------------------------------------
// Timezone Offset Context
// -----------------------------------------------------------------------------
type TimezoneContextProps = {
	timezone: string;
};

const TimezoneContext = React.createContext<TimezoneContextProps | null>(null);

function useTimezoneContext() {
	const context = React.useContext(TimezoneContext);

	if (!context) {
		throw new Error("useTimezoneContext must be used within a TimezoneProvider");
	}

	return context;
}

export function useTimezone() {
	const context = useTimezoneContext();

	return context.timezone;
}

export const TimezoneProvider = ({ children, timezone }: ProviderProps<{ timezone: string | null }>) => {
	const [_timezone, _setTimezone] = React.useState(timezone);

	React.useEffect(() => {
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

		if (tz !== timezone) {
			void setTimezone({ timezone: tz });
			_setTimezone(tz);
		}
	}, [timezone]);

	return (
		<TimezoneContext.Provider value={{ timezone: _timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone }}>
			{children}
		</TimezoneContext.Provider>
	);
};
