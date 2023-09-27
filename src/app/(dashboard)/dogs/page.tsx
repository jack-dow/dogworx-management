import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { DogsTable } from "./_components/dogs-table";

export const metadata: Metadata = {
	title: "Dogs | Dogworx Management",
};

async function DogsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const response = await server.app.dogs.all.query({
		page: searchParams?.page,
		limit: searchParams?.limit,
		sortBy: searchParams?.sortBy,
		sortDirection: searchParams?.sortDirection,
	});

	return (
		<>
			<PageHeader title="Manage Dogs" back={{ href: "/" }} />

			<DogsTable initialData={response} />
		</>
	);
}

export default DogsPage;
