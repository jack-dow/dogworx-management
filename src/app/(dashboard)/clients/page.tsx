import { type Metadata } from "next";

import { ManageClientSheet } from "~/components/manage-client-sheet/manage-client-sheet";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { ClientsTable } from "./_components/clients-table";

export const metadata: Metadata = {
	title: "Clients | Dogworx Management",
};

async function ClientsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	// const result = await actions.app.clients.list({
	// 	page: typeof searchParams?.page === "string" ? parseInt(searchParams.page) : undefined,
	// 	rows: typeof searchParams?.rows === "string" ? parseInt(searchParams.rows) : undefined,
	// });

	return (
		<>
			<PageHeader title="Manage Clients" />

			<ClientsTable
				result={{
					page: 1,
					maxPage: 1,
					limit: 5,
					count: 0,
					sortBy: "fullName",
					sortDirection: "asc",
					data: [],
				}}
			/>
		</>
	);
}

export default ClientsPage;
