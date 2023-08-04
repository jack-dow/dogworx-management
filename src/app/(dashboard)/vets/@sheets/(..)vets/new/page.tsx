import { type Metadata } from "next";

import { ManageVetFormInterceptSheet } from "../_components/manage-vet-form-intercept-sheet";

export const metadata: Metadata = {
	title: "Create Vet | Dogworx Management",
};

function NewVetPageInterceptSheet() {
	return <ManageVetFormInterceptSheet />;
}

export default NewVetPageInterceptSheet;
