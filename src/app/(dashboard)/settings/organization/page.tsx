import { type Metadata } from "next";

import { ManageOrganizationForm } from "~/components/manage-organization-form/manage-organization-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export const metadata: Metadata = {
	title: "Organization Settings | Dogworx Management",
};

async function OrganizationSettingsPage() {
	const result = await actions.auth.organizations.current();

	return (
		<>
			<PageHeader title="Organization Settings" back={{ href: "/" }} />

			{result.data ? <ManageOrganizationForm organization={result.data} /> : <NotFound />}
		</>
	);
}
export default OrganizationSettingsPage;
