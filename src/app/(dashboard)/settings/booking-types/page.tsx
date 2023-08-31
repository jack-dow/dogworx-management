import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { BookingTypesTable } from "./_components/booking-types-table";

export const metadata: Metadata = {
	title: "Booking Types | Dogworx Management",
};

async function BookingTypesPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const response = await actions.app.bookingTypes.list({
		page: Number(searchParams?.page) ?? undefined,
		limit: Number(searchParams?.limit) ?? undefined,
		sortBy: typeof searchParams?.sortBy === "string" ? searchParams?.sortBy : undefined,
		sortDirection: typeof searchParams?.sortDirection === "string" ? searchParams?.sortDirection : undefined,
	});
	return (
		<>
			<PageHeader title="Manage Booking Types" back={{ href: "/" }} />

			<BookingTypesTable result={response.data} />
		</>
	);
}

export default BookingTypesPage;
