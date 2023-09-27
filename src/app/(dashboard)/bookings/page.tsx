import { type Metadata } from "next";
import { z } from "zod";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { BookingsTable } from "./_components/bookings-table";

export const metadata: Metadata = {
	title: "Bookings | Dogworx Management",
};

async function BookingsPage({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.extend({
		from: z.string().optional().catch(undefined),
		to: z.string().optional().catch(undefined),
	}).parse(searchParams);

	const response = await server.app.bookings.all.query(validatedSearchParams);

	return (
		<>
			<PageHeader title="Manage Bookings" back={{ href: "/" }} />

			<BookingsTable initialData={response} />
		</>
	);
}

export default BookingsPage;
