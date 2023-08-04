import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { ManageOrganization } from "../_components/manage-organization";

export const metadata: Metadata = {
	title: "Create New Organization | Dogworx Management",
};

function NewOrganizationPage() {
	return (
		<>
			<PageHeader title="Create New Organization" />

			<ManageOrganization variant="form" />
		</>
	);
}

export default NewOrganizationPage;
