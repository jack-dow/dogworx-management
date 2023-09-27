import { redirect } from "next/navigation";

import { server } from "~/lib/trpc/server";

async function SettingsLayout({ children }: { children: React.ReactNode }) {
	const { data: session } = await server.auth.user.sessions.current.query();

	if (!session || (session.user.organizationRole !== "owner" && session.user.organizationRole !== "admin")) {
		redirect("/");
	}

	return <>{children}</>;
}

export default SettingsLayout;
