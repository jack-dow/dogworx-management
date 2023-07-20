"use client";

import { SessionProvider } from "next-auth/react";

type Props = {
	children?: React.ReactNode;
};

/** Has to be exported from a client component */
const NextAuthSessionProvider = ({ children }: Props) => {
	return <SessionProvider>{children}</SessionProvider>;
};

export { NextAuthSessionProvider };
