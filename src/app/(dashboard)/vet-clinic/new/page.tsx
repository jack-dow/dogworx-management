import { type Metadata } from "next";

import { ManageVetClinic } from "~/components/manage-vet-clinic";
import { PageHeader } from "~/components/page-header";

export const metadata: Metadata = {
	title: "Create New Vet Clinic | Dogworx Management",
};

function NewVetClinicPage() {
	return (
		<>
			<PageHeader title="Create New Vet Clinic" back={{ href: "/vet-clinics" }} />

			<ManageVetClinic variant="form" />
		</>
	);
}

export default NewVetClinicPage;
