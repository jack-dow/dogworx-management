import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { DogsTable } from "./_components/dogs-table";

export const metadata: Metadata = {
	title: "Dogs | Dogworx Management",
};

async function DogsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const response = await actions.app.dogs.list({
		page: Number(searchParams?.page) ?? undefined,
		limit: Number(searchParams?.limit) ?? undefined,
		sortBy: typeof searchParams?.sortBy === "string" ? searchParams?.sortBy : undefined,
		sortDirection: typeof searchParams?.sortDirection === "string" ? searchParams?.sortDirection : undefined,
	});

	return (
		<>
			<PageHeader title="Manage Dogs" back={{ href: "/" }} />

			<DogsTable result={response.data} />
		</>
	);
}

export default DogsPage;
