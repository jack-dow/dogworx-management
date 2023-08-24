import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { BookingsTable } from "./_components/bookings-table";

export const metadata: Metadata = {
	title: "Bookings | Dogworx Management",
};

async function BookingsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const response = await actions.app.bookings.list({
		page: Number(searchParams?.page) ?? undefined,
		limit: Number(searchParams?.limit) ?? undefined,
		sortBy: typeof searchParams?.sortBy === "string" ? searchParams?.sortBy : undefined,
		sortDirection: typeof searchParams?.sortDirection === "string" ? searchParams?.sortDirection : "desc",
	});

	return (
		<>
			<PageHeader title="Manage Bookings" back={{ href: "/" }} />

			<BookingsTable result={response.data} />
		</>
	);
}

export default BookingsPage;
