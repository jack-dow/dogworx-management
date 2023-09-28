import { type Metadata } from "next";

import { ManageClientForm } from "~/components/manage-client/manage-client-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";

export function generateMetadata({ params }: { params: { id: string } }) {
	return {
		title: `${params.id === "new" ? "Create" : "Update"} Client | Dogworx Management`,
	} satisfies Metadata;
}

async function UpdateClientPage({ params }: { params: { id: string } }) {
	const result = params.id === "new" ? undefined : await server.app.clients.byId.query({ id: params.id });

	return (
		<>
			<PageHeader title={`${params.id === "new" ? "Create" : "Update"} Client`} back={{ href: "/clients" }} />

			{result?.data !== null ? <ManageClientForm client={result?.data} /> : <NotFound />}
		</>
	);
}
export default UpdateClientPage;
