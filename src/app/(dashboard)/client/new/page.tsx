import { type Metadata } from "next";

import { ManageClient } from "~/components/manage-client";
import { PageHeader } from "~/components/page-header";

export const metadata: Metadata = {
	title: "Create New Client | Dogworx Management",
};

function NewClientPage() {
	return (
		<>
			<PageHeader title="Create New Client" back={{ href: "/clients" }} />

			<ManageClient variant="form" />
		</>
	);
}

export default NewClientPage;
