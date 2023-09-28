import { type Metadata } from "next";

import { server } from "~/lib/trpc/server";
import { type SearchParams } from "~/lib/utils";
import { WeekView } from "../_components/week-view";

export const metadata: Metadata = {
	title: "Weekly Calendar | Dogworx Management",
};

async function WeeklyCalendar({ params }: { params: SearchParams }) {
	const date = Array.isArray(params.date) ? params?.date?.join("-") : undefined;

	const [bookingTypes, bookings] = await Promise.all([
		server.app.bookingTypes.all.query({}),
		server.app.bookings.byWeek.query({
			date,
		}),
	]);

	return (
		<>
			{/* <PageHeader title="Weekly Calendar" back={{ href: "/" }} /> */}

			<WeekView date={date} initialData={bookings} bookingTypes={bookingTypes.data} />
		</>
	);
}

export default WeeklyCalendar;
