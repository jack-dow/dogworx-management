import * as React from "react";
import { type Metadata } from "next";
import { desc } from "drizzle-orm";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { drizzle } from "~/db/drizzle";
import { ManageAccountForm } from "./_components/manage-account-form";

export const metadata: Metadata = {
	title: "Account Settings | Dogworx Management",
};

async function AccountSettingsPage() {
	const session = await actions.auth.sessions.current();

	const userSessions = await drizzle.query.sessions.findMany({
		where: (sessions, { eq }) => eq(sessions.userId, session.user.id),
		orderBy: (sessions) => [desc(sessions.updatedAt), desc(sessions.createdAt), desc(sessions.id)],
	});

	return (
		<>
			<PageHeader title="Account settings" back={{ href: "/" }} />

			<ManageAccountForm sessions={userSessions} />
		</>
	);
}

export default AccountSettingsPage;
