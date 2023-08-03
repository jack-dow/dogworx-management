import { type Metadata } from "next";

import { actions } from "~/actions";
import { ManageVetClinicFormInterceptSheet } from "../_components/manage-vet-clinic-form-intercept-sheet";

export const metadata: Metadata = {
	title: "Update Vet Clinic | Dogworx Management",
};

async function UpdateVetClinicPageInterceptSheet({ params }: { params: { id: string } }) {
	const response = await actions.app.vetClinics.byId(params.id);

	return <ManageVetClinicFormInterceptSheet vetClinic={response.data} />;
}

export default UpdateVetClinicPageInterceptSheet;
