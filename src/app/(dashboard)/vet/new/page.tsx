import { type Metadata } from "next";

import { ManageVet } from "~/components/manage-vet";
import { PageHeader } from "~/components/page-header";

export const metadata: Metadata = {
	title: "Create New Vet | Dogworx Management",
};

function NewVetPage() {
	return (
		<>
			<PageHeader title="Create New Vet" back={{ href: "/vets" }} />

			<ManageVet variant="form" />
		</>
	);
}

export default NewVetPage;
