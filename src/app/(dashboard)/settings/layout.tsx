import { redirect } from "next/navigation";

import { actions } from "~/actions";

async function SettingsLayout({ children }: { children: React.ReactNode }) {
	const session = await actions.auth.sessions.current();

	if (session.user.organizationRole !== "owner" && session.user.organizationRole !== "admin") {
		redirect("/");
	}

	return children;
}

export default SettingsLayout;
