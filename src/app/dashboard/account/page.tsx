import * as React from "react";
import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { AccountSettingsPageForm } from "./_components/manage-account-form";

export const metadata: Metadata = {
	title: "Account Settings | Dogworx Management",
};

function AccountSettingsPage() {
	return (
		<>
			<PageHeader title="Account settings" />

			<AccountSettingsPageForm />
		</>
	);
}

export default AccountSettingsPage;
