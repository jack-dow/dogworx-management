import { type Metadata } from "next";

import { ManageVet } from "~/components/manage-vet";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export const metadata: Metadata = {
	title: "Update Vet | Dogworx Management",
};

async function UpdateVetPage({ params }: { params: { id: string } }) {
	const result = await actions.app.vets.byId(params.id);

	return (
		<>
			<PageHeader
				title={`Update Vet${result.data?.givenName ? ` "${result.data.givenName} ${result.data.familyName}"` : ""}`}
				back={{ href: "/vets" }}
			/>

			{result.data ? <ManageVet variant="form" vet={result.data} /> : <NotFound />}
		</>
	);
}
export default UpdateVetPage;
