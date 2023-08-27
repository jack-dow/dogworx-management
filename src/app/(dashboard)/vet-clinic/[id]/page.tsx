import { type Metadata } from "next";

import { ManageVetClinicForm } from "~/components/manage-vet-clinic/manage-vet-clinic-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export const metadata: Metadata = {
	title: "Update Vet Clinic | Dogworx Management",
};

async function UpdateVetClinicPage({ params }: { params: { id: string } }) {
	const result = await actions.app.vetClinics.byId(params.id);

	return (
		<>
			<PageHeader
				title={`Update Vet Clinic${result.data?.name ? ` "${result.data.name}" ` : ""}`}
				back={{ href: "/vet-clinics" }}
			/>

			{result.data ? <ManageVetClinicForm vetClinic={result.data} /> : <NotFound />}
		</>
	);
}
export default UpdateVetClinicPage;
