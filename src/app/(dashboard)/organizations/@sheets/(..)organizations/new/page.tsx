import { type Metadata } from "next";

import { ManageOrganizationFormInterceptSheet } from "../_components/manage-organization-form-intercept-sheet";

export const metadata: Metadata = {
	title: "Create Organization | Dogworx Management",
};

function NewOrganizationPageInterceptSheet() {
	return <ManageOrganizationFormInterceptSheet />;
}

export default NewOrganizationPageInterceptSheet;
