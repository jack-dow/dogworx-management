import { type Metadata } from "next";

import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { ManageOrganization } from "../_components/manage-organization";

export const metadata: Metadata = {
	title: "Update Organization | Dogworx Management",
};

async function UpdateOrganizationPage({ params }: { params: { id: string } }) {
	const result = await actions.auth.organizations.byId(params.id);

	return (
		<>
			<PageHeader
				title={`Update Organization${result.data?.name ? ` "${result.data.name}" ` : ""}`}
				back={{ href: "/organizations" }}
			/>

			{result.data ? <ManageOrganization variant="form" organization={result.data} /> : <NotFound />}
		</>
	);
}
export default UpdateOrganizationPage;
