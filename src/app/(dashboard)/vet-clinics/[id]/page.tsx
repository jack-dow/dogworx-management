import { type Metadata } from "next";

import { ManageVetClinicForm } from "~/components/manage-vet-clinic/manage-vet-clinic-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export function generateMetadata({ params }: { params: { id: string } }) {
	return {
		title: `${params.id === "new" ? "Create" : "Update"} Vet Clinic | Dogworx Management`,
	} satisfies Metadata;
}

async function UpdateVetClinicPage({ params }: { params: { id: string } }) {
	const vetClinic = params.id === "new" ? undefined : await actions.app.vetClinics.byId(params.id);

	return (
		<>
			<PageHeader
				title={`${params.id === "new" ? "Create" : "Update"} Vet Clinic${
					vetClinic?.data?.name ? ` "${vetClinic?.data.name}" ` : ""
				}`}
				back={{ href: "/vet-clinics" }}
			/>

			{vetClinic?.data !== null ? <ManageVetClinicForm vetClinic={vetClinic?.data} /> : <NotFound />}
		</>
	);
}
export default UpdateVetClinicPage;
