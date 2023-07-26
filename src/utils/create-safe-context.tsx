"use client";

import * as React from "react";

function createSafeContext<ContextValue>(providerName: string) {
	const Context = React.createContext<ContextValue | null>(null);

	const useSafeContext = () => {
		const ctx = React.useContext(Context);

		if (ctx === null) {
			throw new Error(`[${providerName}] useContext must be used within a provider`);
		}

		return ctx;
	};

	const Provider = ({ children, value }: { value: ContextValue; children: React.ReactNode }) => (
		<Context.Provider value={value}>{children}</Context.Provider>
	);

	return [Provider, useSafeContext] as const;
}

export { createSafeContext };
