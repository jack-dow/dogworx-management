import * as React from "react";
import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { ManageAccountForm } from "./_components/manage-account-form";

export const metadata: Metadata = {
	title: "Account Settings | Dogworx Management",
};

async function AccountSettingsPage() {
	const sessions = await server.auth.user.sessions.all.query();

	return (
		<>
			<PageHeader title="Account settings" back={{ href: "/" }} />

			<ManageAccountForm initialSessions={sessions} />
		</>
	);
}

export default AccountSettingsPage;
