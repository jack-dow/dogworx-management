import { type Metadata } from "next";

import { ManageVetClinicForm } from "~/components/manage-vet-clinic/manage-vet-clinic-form";
import { PageHeader } from "~/components/page-header";

export const metadata: Metadata = {
	title: "Create New Vet Clinic | Dogworx Management",
};

function NewVetClinicPage() {
	return (
		<>
			<PageHeader title="Create New Vet Clinic" back={{ href: "/vet-clinics" }} />

			<ManageVetClinicForm />
		</>
	);
}

export default NewVetClinicPage;
