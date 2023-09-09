import { type Metadata } from "next";

import { ManageClientForm } from "~/components/manage-client/manage-client-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export function generateMetadata({ params }: { params: { id: string } }) {
	return {
		title: `${params.id === "new" ? "Create" : "Update"} Client | Dogworx Management`,
	} satisfies Metadata;
}

async function UpdateClientPage({ params }: { params: { id: string } }) {
	const client = params.id === "new" ? undefined : await actions.app.clients.byId(params.id);

	return (
		<>
			<PageHeader
				title={`${params.id === "new" ? "Create" : "Update"} Client${
					client?.data?.givenName ? ` "${client?.data.givenName} ${client?.data.familyName}" ` : ""
				}`}
				back={{ href: "/clients" }}
			/>

			{client?.data !== null ? <ManageClientForm client={client?.data} /> : <NotFound />}
		</>
	);
}
export default UpdateClientPage;
