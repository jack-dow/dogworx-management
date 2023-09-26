import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { BookingsTable } from "./_components/bookings-table";

export const metadata: Metadata = {
	title: "Bookings | Dogworx Management",
};

async function BookingsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const response = await server.app.bookings.all.query({
		page: Number(searchParams?.page) ?? undefined,
		limit: Number(searchParams?.limit) ?? undefined,
		sortBy: typeof searchParams?.sortBy === "string" ? searchParams?.sortBy : undefined,
		sortDirection: typeof searchParams?.sortDirection === "string" ? searchParams?.sortDirection : "desc",
		from: typeof searchParams?.from === "string" ? searchParams?.from : undefined,
		to: typeof searchParams?.to === "string" ? searchParams?.to : undefined,
	});

	return (
		<>
			<PageHeader title="Manage Bookings" back={{ href: "/" }} />

			<BookingsTable initialData={response} />
		</>
	);
}

export default BookingsPage;
