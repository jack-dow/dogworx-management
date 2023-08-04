import { type Metadata } from "next";

import { ManageClient } from "~/components/manage-client";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export const metadata: Metadata = {
	title: "Update Client | Dogworx Management",
};

async function UpdateClientPage({ params }: { params: { id: string } }) {
	const client = await actions.app.clients.byId(params.id);

	return (
		<>
			<PageHeader
				title={`Update Client${client.data?.givenName ? ` "${client.data.givenName} ${client.data.familyName}" ` : ""}`}
				back={{ href: "/clients" }}
			/>

			{client.data ? <ManageClient variant="form" client={client.data} /> : <div>Client not found D:</div>}
		</>
	);
}
export default UpdateClientPage;
