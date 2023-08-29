import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { WeekView } from "../_components/week-view";

export const metadata: Metadata = {
	title: "Weekly Calendar | Dogworx Management",
};

async function WeeklyCalendar({ params }: { params: { [key: string]: string | string[] | undefined } }) {
	const date = Array.isArray(params.date) ? params?.date?.join("-") : undefined;

	const bookings = await actions.app.bookings.week({
		date,
	});

	return (
		<>
			<PageHeader title="Weekly Calendar" back={{ href: "/" }} />

			<WeekView date={date} bookings={bookings.data} />
		</>
	);
}

export default WeeklyCalendar;
