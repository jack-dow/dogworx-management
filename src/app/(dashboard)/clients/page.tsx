import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { ClientsTable } from "./_components/clients-table";

export const metadata: Metadata = {
	title: "Clients | Dogworx Management",
};

async function ClientsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const response = await server.app.clients.all.query({
		page: Number(searchParams?.page) ?? undefined,
		limit: Number(searchParams?.limit) ?? undefined,
		sortBy: typeof searchParams?.sortBy === "string" ? searchParams?.sortBy : undefined,
		sortDirection: typeof searchParams?.sortDirection === "string" ? searchParams?.sortDirection : undefined,
	});

	return (
		<>
			<PageHeader title="Manage Clients" back={{ href: "/" }} />

			<ClientsTable initialData={response} />
		</>
	);
}

export default ClientsPage;
