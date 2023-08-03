import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { ManageVetClinicForm } from "../_components/manage-vet-clinic-form";

export const metadata: Metadata = {
	title: "Update Vet Clinic | Dogworx Management",
};

async function UpdateVetClinicPage({ params }: { params: { id: string } }) {
	const vetClinic = await actions.app.vetClinics.byId(params.id);

	return (
		<>
			<PageHeader title={`Update Client${vetClinic.data?.name ? ` "${vetClinic.data.name}" ` : ""}`} />

			{vetClinic.data ? <ManageVetClinicForm vetClinic={vetClinic.data} /> : <div>Vet Clinic not found D:</div>}
		</>
	);
}
export default UpdateVetClinicPage;
