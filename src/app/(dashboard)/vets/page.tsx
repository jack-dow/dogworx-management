import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { VetsTable } from "./_components/vets-table";

export const metadata: Metadata = {
	title: "Vets | Dogworx Management",
};

async function VetsPage({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParams);

	const response = await server.app.vets.all.query(validatedSearchParams);

	return (
		<>
			<PageHeader title="Manage Vets" back={{ href: "/" }} />

			<VetsTable initialData={response} />
		</>
	);
}

export default VetsPage;
