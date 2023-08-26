"use client";

import * as React from "react";
import Link from "next/link";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import isToday from "dayjs/plugin/isToday";
import updateLocale from "dayjs/plugin/updateLocale";

import { ManageBookingDialog } from "~/components/manage-booking/manage-booking-dialog";
import { Button } from "~/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "~/components/ui/icons";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { type BookingsByWeek } from "~/actions";
import { cn, secondsToHumanReadable } from "~/utils";

dayjs.extend(advancedFormat);
dayjs.extend(updateLocale);
dayjs.extend(isToday);
dayjs.updateLocale("en", {
	weekStart: 1,
});

function WeekView({ date, bookings }: { date?: string; bookings: BookingsByWeek | null }) {
	const { toast } = useToast();
	const container = React.useRef<HTMLDivElement>(null);
	const containerNav = React.useRef<HTMLDivElement>(null);
	const containerOffset = React.useRef<HTMLDivElement>(null);

	const startOfWeek = dayjs(date).startOf("week");
	const endOfWeek = dayjs(date).endOf("week");

	const prevWeek = dayjs(date).subtract(7, "days");
	const nextWeek = dayjs(date).add(7, "days");

	const [isManageBookingDialogOpen, setIsManageBookingDialogOpen] = React.useState(false);
	const [selectedBooking, setSelectedBooking] = React.useState<BookingsByWeek[number] | undefined>(undefined);
	const [lastSelectedDate, setLastSelectedDate] = React.useState<dayjs.Dayjs | undefined>(undefined);

	React.useEffect(() => {
		// Set the container scroll position based on the current time.
		const currentMinute = new Date().getHours() * 60;
		if (container.current && containerNav.current && containerOffset.current) {
			container.current.scrollTop =
				((container.current.scrollHeight - containerNav.current.offsetHeight - containerOffset.current.offsetHeight) *
					currentMinute) /
				1440;
		}
	}, []);

	React.useEffect(() => {
		if (bookings === null) {
			// HACK: If it is not wrapped in a setTimeout it will not render
			setTimeout(() => {
				toast({
					title: "Failed to fetch bookings",
					description: "An unknown error occurred while fetching bookings for this week. Please try again later.",
					variant: "destructive",
				});
			}, 0);
		}
	}, [bookings, toast]);

	return (
		<div className="flex h-full flex-col">
			<header className="flex flex-none items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
				<h1 className="text-base font-semibold leading-6 text-gray-900">
					<span className="sr-only">Week of </span>
					<span>
						{startOfWeek.month() !== endOfWeek.month() ? (
							<>
								{startOfWeek.format("MMMM Do")}{" "}
								{startOfWeek.year() !== endOfWeek.year() ? startOfWeek.format("YYYY") : undefined} -{" "}
								{endOfWeek.format("Do MMMM")} {endOfWeek.format("YYYY")}
							</>
						) : (
							<>
								{startOfWeek.format("D")} - {endOfWeek.format("Do")} {startOfWeek.format("MMMM YYYY")}
							</>
						)}
					</span>
				</h1>
				<div className="flex items-center gap-x-3 md:gap-x-5">
					<div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
						<Button
							size="icon"
							variant="outline"
							className="h-8 w-8 rounded-r-none focus:relative focus-visible:outline-offset-0"
							asChild
						>
							<Link href={`/calendar/week/${prevWeek.year()}/${prevWeek.month() + 1}/${prevWeek.date()}`}>
								<span className="sr-only">Previous week</span>
								<ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
							</Link>
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="rounded-none border-x-0 focus:relative focus-visible:rounded-md focus-visible:outline-offset-0"
							asChild
						>
							<Link href={`/calendar/week/${dayjs().year()}/${dayjs().month() + 1}/${dayjs().date()}`}>Today</Link>
						</Button>
						<span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden" />
						<Button
							size="icon"
							variant="outline"
							className="h-8 w-8 rounded-l-none focus:relative focus-visible:outline-offset-0"
							asChild
						>
							<Link href={`/calendar/week/${nextWeek.year()}/${nextWeek.month() + 1}/${nextWeek.date()}`}>
								<span className="sr-only">Next week</span>
								<ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
							</Link>
						</Button>
					</div>

					<Separator orientation="vertical" className="h-4" />
					<ManageBookingDialog trigger={<Button size="sm">Create Booking</Button>} />
				</div>
			</header>
			<div ref={container} className="isolate flex flex-auto flex-col overflow-auto bg-white">
				<div style={{ width: "165%" }} className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full">
					<div ref={containerNav} className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black/5  sm:pr-8">
						<div className="grid grid-cols-7 text-sm leading-6 text-gray-500 sm:hidden">
							<button type="button" className="flex flex-col items-center pb-3 pt-2">
								M <span className="mt-1 flex h-8 w-8 items-center justify-center font-semibold text-gray-900">10</span>
							</button>
							<button type="button" className="flex flex-col items-center pb-3 pt-2">
								T <span className="mt-1 flex h-8 w-8 items-center justify-center font-semibold text-gray-900">11</span>
							</button>
							<button type="button" className="flex flex-col items-center pb-3 pt-2">
								W{" "}
								<span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
									12
								</span>
							</button>
							<button type="button" className="flex flex-col items-center pb-3 pt-2">
								T <span className="mt-1 flex h-8 w-8 items-center justify-center font-semibold text-gray-900">13</span>
							</button>
							<button type="button" className="flex flex-col items-center pb-3 pt-2">
								F <span className="mt-1 flex h-8 w-8 items-center justify-center font-semibold text-gray-900">14</span>
							</button>
							<button type="button" className="flex flex-col items-center pb-3 pt-2">
								S <span className="mt-1 flex h-8 w-8 items-center justify-center font-semibold text-gray-900">15</span>
							</button>
							<button type="button" className="flex flex-col items-center pb-3 pt-2">
								S <span className="mt-1 flex h-8 w-8 items-center justify-center font-semibold text-gray-900">16</span>
							</button>
						</div>

						<div className="-mr-px hidden grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm leading-6 text-gray-500 sm:grid">
							<div className="col-end-1 w-14" />
							{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
								const date = startOfWeek.add(index, "day");
								return (
									<div key={day} className={cn("flex items-center justify-center py-3")}>
										<span
											className={cn(date.isToday() ? "bg-primary text-primary-foreground rounded-md px-3 py-1" : "")}
										>
											{day}{" "}
											<span
												className={cn(
													"items-center justify-center font-semibold",
													date.isToday() ? "text-white" : "text-primary",
												)}
											>
												{date.date()}
											</span>
										</span>
									</div>
								);
							})}
						</div>
					</div>
					<div className="flex flex-auto">
						<div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
						<div className="grid flex-auto grid-cols-1 grid-rows-1">
							{/* Horizontal lines */}
							<div
								className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
								style={{ gridTemplateRows: "repeat(48, minmax(2.5rem, 1fr))" }}
							>
								<div ref={containerOffset} className="row-end-1 h-4" />

								{[
									"12AM",
									"1AM",
									"2AM",
									"3AM",
									"4AM",
									"5AM",
									"6AM",
									"7AM",
									"8AM",
									"9AM",
									"10AM",
									"11AM",
									"12PM",
									"1PM",
									"2PM",
									"3PM",
									"4PM",
									"5PM",
									"6PM",
									"7PM",
									"8PM",
									"9PM",
									"10PM",
									"11PM",
								].map((time) => (
									<React.Fragment key={time}>
										<div>
											<div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
												{time}
											</div>
										</div>
										<div />
									</React.Fragment>
								))}
							</div>

							{/* Vertical lines */}
							<div className="col-start-1 col-end-2 row-start-1 hidden grid-cols-7 grid-rows-1 divide-x divide-gray-100 sm:grid sm:grid-cols-7">
								<div className="col-start-1 row-span-full" />
								<div className="col-start-2 row-span-full" />
								<div className="col-start-3 row-span-full" />
								<div className="col-start-4 row-span-full" />
								<div className="col-start-5 row-span-full" />
								<div className="col-start-6 row-span-full" />
								<div className="col-start-7 row-span-full" />
								<div className="col-start-8 row-span-full w-8" />
							</div>

							<ManageBookingDialog
								withoutTrigger
								open={isManageBookingDialogOpen}
								setOpen={(value) => {
									setIsManageBookingDialogOpen(value);

									if (!value) {
										setTimeout(() => {
											setLastSelectedDate(undefined);
											setSelectedBooking(undefined);
										}, 205);
									}
								}}
								booking={selectedBooking}
								defaultValues={
									lastSelectedDate
										? {
												date: lastSelectedDate?.toDate(),
										  }
										: undefined
								}
							/>

							{/* Events */}
							<ol
								className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7 sm:pr-8"
								style={{ gridTemplateRows: "1.75rem repeat(288, minmax(0, 1fr)) auto" }}
								onClick={(event) => {
									const div = event.currentTarget;
									const rect = div.getBoundingClientRect();

									const offsetX = event.clientX - rect.left;
									const offsetY = event.clientY - rect.top - 16;

									if (offsetY < 0) {
										return;
									}

									const day = Math.floor(offsetX / (rect.width / 7));
									const timeRounded = Math.floor(((offsetY - 16) / 80) * 2) / 2;

									const date = startOfWeek.startOf("day").add(day, "day").add(timeRounded, "hour");

									setIsManageBookingDialogOpen(true);
									setLastSelectedDate(date);
								}}
							>
								{bookings?.map((booking) => {
									const bookingDate = dayjs(booking.date);
									// Convert time to fraction. e.g. 10:30 AM => 10.5
									const bookingTime = bookingDate.hour() + bookingDate.minute() / 60;
									return (
										<li
											key={booking.id}
											className="relative mt-px hidden sm:col-start-6 sm:flex"
											style={{
												gridRow: `${Math.floor((288 / 24) * bookingTime + 1)} / span ${(booking.duration / 60) * 0.2}`,
												gridColumnStart: bookingDate.day(),
											}}
										>
											<button
												className="group absolute inset-1 flex flex-col overflow-hidden rounded-lg bg-violet-50 p-1.5 text-xs leading-5 hover:bg-violet-100 "
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													setIsManageBookingDialogOpen(true);
													setSelectedBooking(booking);
												}}
											>
												<p className="text-violet-500 group-hover:text-violet-700">
													<time dateTime="2022-01-15T10:00">{bookingDate.format("h:mmA")}</time>
													<span className={cn(booking.duration < 2700 ? "hidden" : "inline")}> - </span>
													<span className={cn(booking.duration < 2700 ? "sr-only" : "inline")}>
														{secondsToHumanReadable(booking.duration)}
													</span>
													{booking.duration < 2700 && (
														<>
															<span> - </span>
															<span>
																{booking.dog.givenName} {booking.dog.familyName}
															</span>
														</>
													)}
												</p>
												{booking.duration >= 2700 && (
													<p className="font-semibold text-violet-700">
														{booking.dog.givenName} {booking.dog.familyName}
													</p>
												)}
											</button>
										</li>
									);
								})}
							</ol>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export { WeekView };
