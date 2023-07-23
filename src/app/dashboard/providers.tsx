"use client";

import * as React from "react";

import { type SessionCookie } from "~/lib/auth-options";

type ProviderProps<Props> = {
	children: React.ReactNode;
} & Props;

type SessionContextProps = {
	session: SessionCookie;
};

const SessionContext = React.createContext<SessionContextProps | null>(null);

function useSafeSessionContext() {
	const context = React.useContext(SessionContext);

	if (!context) {
		throw new Error("useSafeSessionContext must be used within a SessionProvider");
	}

	return context;
}

function useSession() {
	const context = useSafeSessionContext();

	return context.session;
}

function useUser() {
	const session = useSession();

	return session.user;
}

/** Has to be exported from a client component */
const SessionProvider = ({ children, session }: ProviderProps<{ session: SessionCookie }>) => {
	const [_session, setSession] = React.useState<SessionCookie>(session);

	console.log("session provider", _session);

	React.useEffect(() => {
		setSession(session);
	}, [session]);

	return <SessionContext.Provider value={{ session: _session }}>{children}</SessionContext.Provider>;
};

export { SessionContext, SessionProvider, useSession, useUser };
