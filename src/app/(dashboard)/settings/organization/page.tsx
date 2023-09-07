import { type Metadata } from "next";

import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { OrganizationSettingsForm } from "./_components/organization-settings-form";

export const metadata: Metadata = {
	title: "Organization Settings | Dogworx Management",
};

async function OrganizationSettingsPage() {
	const result = await actions.auth.organizations.current();

	return (
		<>
			<PageHeader title="Organization Settings" back={{ href: "/" }} />

			{result.data ? <OrganizationSettingsForm organization={result.data} /> : <NotFound />}
		</>
	);
}
export default OrganizationSettingsPage;
