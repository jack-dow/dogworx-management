import { type Metadata } from "next";

import { ManageVetForm } from "~/components/manage-vet/manage-vet-form";
import { PageHeader } from "~/components/page-header";

export const metadata: Metadata = {
	title: "Create New Vet | Dogworx Management",
};

function NewVetPage() {
	return (
		<>
			<PageHeader title="Create New Vet" back={{ href: "/vets" }} />

			<ManageVetForm />
		</>
	);
}

export default NewVetPage;
