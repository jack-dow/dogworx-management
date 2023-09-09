import { type Metadata } from "next";

import { ManageOrganizationForm } from "~/components/manage-organization-form/manage-organization-form";
import { PageHeader } from "~/components/page-header";

export const metadata: Metadata = {
	title: "Create New Organization | Dogworx Management",
};

function NewOrganizationPage() {
	return (
		<>
			<PageHeader title="Create New Organization" back={{ href: "/organizations" }} />

			<ManageOrganizationForm />
		</>
	);
}

export default NewOrganizationPage;
