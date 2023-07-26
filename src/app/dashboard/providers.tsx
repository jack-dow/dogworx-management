"use client";

// -----------------------------------------------------------------------------
// This file exists because Providers must be exported from a client component
// -----------------------------------------------------------------------------
import * as React from "react";

import { createSafeContext } from "~/utils/create-safe-context";
import { type SessionCookie } from "~/lib/auth-options";

type ProviderProps<Props> = {
	children: React.ReactNode;
} & Props;

// -----------------------------------------------------------------------------
// Session Context
// -----------------------------------------------------------------------------
type SessionContextProps = {
	session: SessionCookie;
};

const [SessionContextProvider, useSessionContext] = createSafeContext<SessionContextProps>("SessionContext");

function useSession() {
	const context = useSessionContext();

	return context.session;
}

/**
 * Hook for easily accessing the user object within a session.
 */
function useUser() {
	const session = useSession();

	return session.user;
}

const SessionProvider = ({ children, session }: ProviderProps<{ session: SessionCookie }>) => {
	const [_session, setSession] = React.useState<SessionCookie>(session);

	React.useEffect(() => {
		setSession(session);
	}, [session]);

	return <SessionContextProvider value={{ session: _session }}>{children}</SessionContextProvider>;
};

export { SessionProvider, useSession, useUser };
