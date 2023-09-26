import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { VetsTable } from "./_components/vets-table";

export const metadata: Metadata = {
	title: "Vets | Dogworx Management",
};

async function VetsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const response = await server.app.vets.all.query({
		page: Number(searchParams?.page) ?? undefined,
		limit: Number(searchParams?.limit) ?? undefined,
		sortBy: typeof searchParams?.sortBy === "string" ? searchParams?.sortBy : undefined,
		sortDirection: typeof searchParams?.sortDirection === "string" ? searchParams?.sortDirection : undefined,
	});

	return (
		<>
			<PageHeader title="Manage Vets" back={{ href: "/" }} />

			<VetsTable initialData={response} />
		</>
	);
}

export default VetsPage;
