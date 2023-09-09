import { type Metadata } from "next";

import { ManageOrganizationForm } from "~/components/manage-organization-form/manage-organization-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export function generateMetadata({ params }: { params: { id: string } }) {
	return {
		title: `${params.id === "new" ? "Create" : "Update"} Organization | Dogworx Management`,
	} satisfies Metadata;
}

async function UpdateOrganizationPage({ params }: { params: { id: string } }) {
	const organization = params.id === "new" ? undefined : await actions.auth.organizations.byId(params.id);

	return (
		<>
			<PageHeader
				title={`${params.id === "new" ? "Create" : "Update"} Organization${
					organization?.data?.name ? ` "${organization?.data.name}" ` : ""
				}`}
				back={{ href: "/organizations" }}
			/>

			{organization?.data !== null ? <ManageOrganizationForm organization={organization?.data} /> : <NotFound />}
		</>
	);
}
export default UpdateOrganizationPage;
