import { type Metadata } from "next";

import { server } from "~/lib/trpc/server";
import { WeekView } from "../_components/week-view";

export const metadata: Metadata = {
	title: "Weekly Calendar | Dogworx Management",
};

async function WeeklyCalendar({ params }: { params: { [key: string]: string | string[] | undefined } }) {
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
