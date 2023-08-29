import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { VetsTable } from "./_components/vets-table";

export const metadata: Metadata = {
	title: "Vets | Dogworx Management",
};

async function VetsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const response = await actions.app.vets.list({
		page: Number(searchParams?.page) ?? undefined,
		limit: Number(searchParams?.limit) ?? undefined,
		sortBy: typeof searchParams?.sortBy === "string" ? searchParams?.sortBy : undefined,
		sortDirection: typeof searchParams?.sortDirection === "string" ? searchParams?.sortDirection : undefined,
	});

	return (
		<>
			<PageHeader title="Manage Vets" back={{ href: "/" }} />

			<VetsTable result={response.data} />
		</>
	);
}

export default VetsPage;
