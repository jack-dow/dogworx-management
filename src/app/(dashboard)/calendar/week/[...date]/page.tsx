import { type Metadata } from "next";

import { actions } from "~/actions";
import { getServerUser } from "~/actions/utils";
import { cn } from "~/utils";
import { WeekView } from "../_components/week-view";

export const metadata: Metadata = {
	title: "Weekly Calendar | Dogworx Management",
};

async function WeeklyCalendar({ params }: { params: { [key: string]: string | string[] | undefined } }) {
	const user = await getServerUser();
	const prefersDarkMode = user?.organizationId !== "mslu0ytyi8i2g7u1rdvooe55";

	const date = Array.isArray(params.date) ? params?.date?.join("-") : undefined;

	const bookings = await actions.app.bookings.week({
		date,
	});

	return (
		<>
			<div className="relative w-full">
				<div
					className={cn(
						"absolute w-full",
						prefersDarkMode
							? "-ml-6 -mt-6 h-[calc(100vh-24px)] w-screen lg:-ml-0 lg:-mt-10 lg:h-[calc(100vh-40px)] lg:w-full"
							: "-ml-4 -mt-6 h-screen w-screen overflow-hidden rounded-md sm:-ml-6 sm:-mt-8 sm:h-[calc(100vh-16px)] sm:w-[calc(100%+48px)] md:-ml-8 md:h-[calc(100vh-48px)] md:w-[calc(100%+64px)] lg:-ml-10 lg:-mt-10 lg:h-[calc(100vh-32px)] lg:w-[calc(100%+80px)] 2xl:h-[calc(100vh-48px)]",
					)}
				>
					<WeekView date={date} bookings={bookings.data} />
				</div>
			</div>
		</>
	);
}

export default WeeklyCalendar;
