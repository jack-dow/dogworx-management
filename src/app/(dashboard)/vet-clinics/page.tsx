import { type Metadata } from "next";

import { ManageVetClinicSheet } from "~/components/manage-vet-clinic-sheet";
import { PageHeader } from "~/components/page-header";
import { api } from "~/api";
import { VetClinicsTable } from "./_components/vet-clinics-table";

export const metadata: Metadata = {
	title: "Vet Clinics | Dogworx Management",
};

async function VetsPage() {
	const { data: vetClinics } = await api.vetClinics.list();
	return (
		<>
			<PageHeader title="Manage Vets Clinics" action={<ManageVetClinicSheet />} />

			<VetClinicsTable vetClinics={vetClinics ?? []} />
		</>
	);
}

export default VetsPage;
