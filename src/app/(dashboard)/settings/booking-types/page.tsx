import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { BookingTypesTable } from "./_components/booking-types-table";

export const metadata: Metadata = {
	title: "Booking Types | Dogworx Management",
};

async function BookingTypesPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const response = await server.app.bookingTypes.all.query({
		page: Number(searchParams?.page) ?? undefined,
		limit: Number(searchParams?.limit) ?? undefined,
		sortBy: typeof searchParams?.sortBy === "string" ? searchParams?.sortBy : undefined,
		sortDirection: typeof searchParams?.sortDirection === "string" ? searchParams?.sortDirection : undefined,
	});
	return (
		<>
			<PageHeader title="Manage Booking Types" back={{ href: "/" }} />

			<BookingTypesTable initialResult={response} />
		</>
	);
}

export default BookingTypesPage;
