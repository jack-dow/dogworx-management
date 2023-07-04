import * as React from "react";

import { PageHeader } from "~/components/page-header";
import { AccountSettingsPageForm } from "./_components/account-settings-page-form";

function AccountSettingsPage() {
	return (
		<>
			<PageHeader title="Account settings" />

			<AccountSettingsPageForm />
		</>
	);
}

export default AccountSettingsPage;
