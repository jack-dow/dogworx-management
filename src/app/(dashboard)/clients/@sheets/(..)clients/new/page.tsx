import { type Metadata } from "next";

import { ManageClientFormInterceptSheet } from "../_components/manage-client-form-intercept-sheet";

export const metadata: Metadata = {
	title: "Create Client | Dogworx Management",
};

function NewClientPageInterceptSheet() {
	return <ManageClientFormInterceptSheet />;
}

export default NewClientPageInterceptSheet;
