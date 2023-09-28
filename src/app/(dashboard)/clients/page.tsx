import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { ClientsTable } from "./_components/clients-table";

export const metadata: Metadata = {
	title: "Clients | Dogworx Management",
};

async function ClientsPage({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParams);

	const response = await server.app.clients.all.query(validatedSearchParams);

	return (
		<>
			<PageHeader title="Manage Clients" back={{ href: "/" }} />

			<ClientsTable initialData={response} />
		</>
	);
}

export default ClientsPage;
