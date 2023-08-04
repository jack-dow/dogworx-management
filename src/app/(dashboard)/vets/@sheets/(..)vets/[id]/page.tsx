import { type Metadata } from "next";

import { actions } from "~/actions";
import { ManageVetFormInterceptSheet } from "../_components/manage-vet-form-intercept-sheet";

export const metadata: Metadata = {
	title: "Update Vet | Dogworx Management",
};

async function UpdateVetPageInterceptSheet({ params }: { params: { id: string } }) {
	const response = await actions.app.vets.byId(params.id);

	return <ManageVetFormInterceptSheet vet={response.data ?? undefined} />;
}

export default UpdateVetPageInterceptSheet;
