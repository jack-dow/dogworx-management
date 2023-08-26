import { type Metadata } from "next";

import { actions } from "~/actions";
import { WeekView } from "./_components/week-view";

export const metadata: Metadata = {
	title: "Weekly Calendar | Dogworx Management",
};

async function WeeklyCalendarPage() {
	const bookings = await actions.app.bookings.week();

	return (
		<>
			<div className="relative -mt-10 h-[calc(100vh-40px)]">
				<div className="absolute h-screen w-full">
					<WeekView bookings={bookings.data} />
				</div>
			</div>
		</>
	);
}

export default WeeklyCalendarPage;
