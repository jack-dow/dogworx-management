import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { ManageOrganizationForm } from "../_components/manage-organization/manage-organization-form";

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
