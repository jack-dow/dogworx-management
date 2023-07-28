"use client";

// -----------------------------------------------------------------------------
// This file exists because Providers must be exported from a client component
// -----------------------------------------------------------------------------
import * as React from "react";

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

const SessionContext = React.createContext<SessionContextProps | null>(null);

function useSessionContext() {
	const context = React.useContext(SessionContext);

	if (!context) {
		throw new Error("useSessionContext must be used within a SessionProvider");
	}

	return context;
}

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

	return <SessionContext.Provider value={{ session: _session }}>{children}</SessionContext.Provider>;
};

export { SessionProvider, useSession, useUser };
