import { type Metadata } from "next";

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
			<PageHeader title={`Update Organization${result.data?.name ? ` "${result.data.name}" ` : ""}`} />

			{result.data ? (
				<ManageOrganization variant="form" organization={result.data} />
			) : (
				<div>Organization not found D:</div>
			)}
		</>
	);
}
export default UpdateOrganizationPage;
