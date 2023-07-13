import { type Metadata } from "next";

import { ManageClientSheet } from "~/components/manage-client-sheet/manage-client-sheet";
import { PageHeader } from "~/components/page-header";
import { api } from "~/api";
import { ClientsTable } from "./_components/clients-table";

export const metadata: Metadata = {
	title: "Clients | Dogworx Management",
};

async function ClientsPage() {
	const result = await api.clients.list();

	return (
		<>
			<PageHeader title="Manage Clients" action={<ManageClientSheet />} />

			<ClientsTable clients={result.data ?? []} />
		</>
	);
}

export default ClientsPage;
