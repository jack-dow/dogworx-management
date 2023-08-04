import { type Metadata } from "next";

import { ManageVetClinic } from "~/components/manage-vet-clinic";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export const metadata: Metadata = {
	title: "Update Vet Clinic | Dogworx Management",
};

async function UpdateVetClinicPage({ params }: { params: { id: string } }) {
	const result = await actions.app.vetClinics.byId(params.id);

	return (
		<>
			<PageHeader title={`Update Vet Clinic${result.data?.name ? ` "${result.data.name}" ` : ""}`} back={{ href: "/vet-clinics" }} />

			{result.data ? (
				<ManageVetClinic variant="form" vetClinic={result.data} />
			) : (
				<div>Vet Clinic not found D:</div>
			)}
		</>
	);
}
export default UpdateVetClinicPage;
