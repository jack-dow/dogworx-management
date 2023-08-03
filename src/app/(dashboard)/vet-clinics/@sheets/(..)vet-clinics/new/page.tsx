import { type Metadata } from "next";

import { ManageVetClinicFormInterceptSheet } from "../_components/manage-vet-clinic-form-intercept-sheet";

export const metadata: Metadata = {
	title: "Create Vet Clinic | Dogworx Management",
};

function NewVetClinicPageInterceptSheet() {
	return <ManageVetClinicFormInterceptSheet />;
}

export default NewVetClinicPageInterceptSheet;
