import { type Metadata } from "next";

import { ManageClientForm } from "~/components/manage-client/manage-client-form";
import { PageHeader } from "~/components/page-header";

export const metadata: Metadata = {
	title: "Create New Client | Dogworx Management",
};

function NewClientPage() {
	return (
		<>
			<PageHeader title="Create New Client" back={{ href: "/clients" }} />

			<ManageClientForm />
		</>
	);
}

export default NewClientPage;
