import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { DogsTable } from "./_components/dogs-table";

export const metadata: Metadata = {
	title: "Dogs | Dogworx Management",
};

async function DogsPage({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParams);

	const response = await server.app.dogs.all.query(validatedSearchParams);

	return (
		<>
			<PageHeader title="Manage Dogs" back={{ href: "/" }} />

			<DogsTable initialData={response} />
		</>
	);
}

export default DogsPage;
