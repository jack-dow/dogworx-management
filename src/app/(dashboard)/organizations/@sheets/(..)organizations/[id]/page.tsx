import { type Metadata } from "next";

import { actions } from "~/actions";
import { ManageOrganizationFormInterceptSheet } from "../_components/manage-organization-form-intercept-sheet";

export const metadata: Metadata = {
	title: "Update Organization | Dogworx Management",
};

async function UpdateOrganizationPageInterceptSheet({ params }: { params: { id: string } }) {
	const response = await actions.auth.organizations.byId(params.id);

	return <ManageOrganizationFormInterceptSheet organization={response.data ?? undefined} />;
}

export default UpdateOrganizationPageInterceptSheet;
