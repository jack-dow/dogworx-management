"use client";

// -----------------------------------------------------------------------------
// This file exists because Providers must be exported from a client component
// -----------------------------------------------------------------------------
import * as React from "react";

import { actions } from "~/actions";
import { type SessionCookie } from "~/lib/auth-options";

type ProviderProps<Props = undefined> = Props extends undefined
	? {
			children: React.ReactNode;
	  }
	: { children: React.ReactNode } & Props;

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

	context.session.user.createdAt = new Date(context.session.user.createdAt);
	context.session.user.updatedAt = new Date(context.session.user.updatedAt);

	return context.session;
}

/**
 * Hook for easily accessing the user object within a session.
 */
function useUser() {
	const session = useSession();

	session.user.createdAt = new Date(session.user.createdAt);
	session.user.updatedAt = new Date(session.user.updatedAt);

	return session.user;
}

const SessionProvider = ({ children, session }: ProviderProps<{ session: SessionCookie }>) => {
	const [_session, setSession] = React.useState<SessionCookie>(session);

	React.useEffect(() => {
		setSession(session);
	}, [session]);

	return <SessionContext.Provider value={{ session: _session }}>{children}</SessionContext.Provider>;
};

const TimezoneOffsetProvider = ({ children }: ProviderProps) => {
	React.useEffect(() => {
		void actions.app.users.setTimezoneOffset(new Date().getTimezoneOffset() * -1);
	}, []);

	return children;
};

export { SessionProvider, useSession, useUser, TimezoneOffsetProvider };
