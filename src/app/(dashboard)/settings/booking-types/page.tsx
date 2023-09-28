import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { BookingTypesTable } from "./_components/booking-types-table";

export const metadata: Metadata = {
	title: "Booking Types | Dogworx Management",
};

async function BookingTypesPage({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParams);

	const response = await server.app.bookingTypes.all.query(validatedSearchParams);

	return (
		<>
			<PageHeader title="Manage Booking Types" back={{ href: "/" }} />

			<BookingTypesTable initialData={response} />
		</>
	);
}

export default BookingTypesPage;
