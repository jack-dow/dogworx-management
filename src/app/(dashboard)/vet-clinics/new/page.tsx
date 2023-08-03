import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { ManageVetClinicForm } from "../_components/manage-vet-clinic-form";

export const metadata: Metadata = {
	title: "Create New Client | Dogworx Management",
};

function NewVetClinicPage() {
	return (
		<>
			<PageHeader title="Create New Vet Clinic" />

			<ManageVetClinicForm />
		</>
	);
}

export default NewVetClinicPage;
