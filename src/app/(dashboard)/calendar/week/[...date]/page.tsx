import { type Metadata } from "next";

import { actions } from "~/actions";
import { WeekView } from "../_components/week-view";

export const metadata: Metadata = {
	title: "Weekly Calendar | Dogworx Management",
};

async function WeeklyCalendarWithDatePage({ params }: { params: { [key: string]: string | string[] | undefined } }) {
	const date = Array.isArray(params.date) ? params?.date?.join("-") : undefined;

	const bookings = await actions.app.bookings.week({
		date,
	});

	return (
		<>
			<div className="relative -mt-10 h-[calc(100vh-40px)]">
				<div className="absolute h-screen w-full">
					<WeekView date={date} bookings={bookings.data} />
				</div>
			</div>
		</>
	);
}

export default WeeklyCalendarWithDatePage;
