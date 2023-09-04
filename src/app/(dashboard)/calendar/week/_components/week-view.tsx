"use client";

import * as React from "react";
import Link from "next/link";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import isToday from "dayjs/plugin/isToday";
import updateLocale from "dayjs/plugin/updateLocale";

import { type BOOKING_TYPES_COLORS } from "~/components/manage-booking-types/booking-types-fields";
import { ManageBookingDialog } from "~/components/manage-booking/manage-booking-dialog";
import { Button } from "~/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, DogIcon, EditIcon } from "~/components/ui/icons";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { type BookingsByWeek, type BookingTypesList } from "~/actions";
import { useUser } from "~/app/providers";
import { useViewportSize } from "~/hooks/use-viewport-size";
import { cn, secondsToHumanReadable } from "~/utils";

dayjs.extend(advancedFormat);
dayjs.extend(updateLocale);
dayjs.extend(isToday);
dayjs.updateLocale("en", {
	weekStart: 1,
});

type Booking = BookingsByWeek[number];

function areBookingsOverlapping(booking1: Booking, booking2: Booking): boolean {
	const startDateTime1 = dayjs(booking1.date);
	const endDateTime1 = startDateTime1.add(booking1.duration, "second");

	const startDateTime2 = dayjs(booking2.date);
	const endDateTime2 = startDateTime2.add(booking2.duration, "second");

	return startDateTime1.isBefore(endDateTime2) && endDateTime1.isAfter(startDateTime2);
}

function groupOverlappingBookings(bookings: Booking[]) {
	const groups: Booking[][] = [];
	const seen = new Set();

	bookings.sort((a, b) => {
		if (a.date > b.date) {
			return 1;
		}

		if (a.date < b.date) {
			return -1;
		}

		return 0;
	});

	for (let i = 0; i < bookings.length; i++) {
		const currentBooking = bookings[i];

		if (!currentBooking) {
			continue;
		}

		if (seen.has(currentBooking.id)) {
			continue;
		}

		const group: Booking[] = [currentBooking];
		seen.add(currentBooking.id);

		for (let j = 0; j < bookings.length; j++) {
			if (i !== j) {
				const otherBooking = bookings[j];
				if (!otherBooking) {
					continue;
				}

				if (seen.has(otherBooking.id)) {
					continue;
				}

				if (areBookingsOverlapping(currentBooking, otherBooking)) {
					group.push(otherBooking);
					seen.add(otherBooking.id);
				}
			}
		}

		group.sort((a, b) => {
			if (a.date > b.date) {
				return 1;
			}

			if (a.date < b.date) {
				return -1;
			}

			return 0;
		});
		groups.push(group);
	}

	return groups;
}

const colStartClasses = [
	"sm:col-start-7",
	"sm:col-start-1",
	"sm:col-start-2",
	"sm:col-start-3",
	"sm:col-start-4",
	"sm:col-start-5",
	"sm:col-start-6",
];

const bookingCardColors = {
	gray: { card: "border-slate-200 bg-slate-50 hover:bg-slate-100", text: "text-slate-700" },
	red: { card: "border-red-200 bg-red-50 hover:bg-red-100", text: "text-red-700" },
	amber: { card: "border-amber-200 bg-amber-50 hover:bg-amber-100", text: "text-amber-700" },
	yellow: { card: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100", text: "text-yellow-700" },
	lime: { card: "border-lime-200 bg-lime-50 hover:bg-lime-100", text: "text-lime-700" },
	emerald: { card: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100", text: "text-emerald-700" },
	teal: { card: "border-teal-200 bg-teal-50 hover:bg-teal-100", text: "text-teal-700" },
	cyan: { card: "border-cyan-200 bg-cyan-50 hover:bg-cyan-100", text: "text-cyan-700" },
	sky: { card: "border-sky-200 bg-sky-50 hover:bg-sky-100", text: "text-sky-700" },
	purple: { card: "border-purple-200 bg-purple-50 hover:bg-purple-100", text: "text-purple-700" },
	rose: { card: "border-rose-200 bg-rose-50 hover:bg-rose-100", text: "text-rose-700" },
} satisfies Record<keyof typeof BOOKING_TYPES_COLORS, { card: string; text: string }>;

function WeekView({
	date,
	bookings,
	bookingTypes,
}: {
	date?: string;
	bookings: BookingsByWeek | null;
	bookingTypes: BookingTypesList["data"];
}) {
	const { toast } = useToast();

	const container = React.useRef<HTMLDivElement>(null);
	const containerNav = React.useRef<HTMLDivElement>(null);
	const containerOffset = React.useRef<HTMLDivElement>(null);

	const user = useUser();

	const startOfWeek = dayjs(date).startOf("week");
	const endOfWeek = dayjs(date).endOf("week");

	const prevWeek = dayjs(date).subtract(7, "days");
	const nextWeek = dayjs(date).add(7, "days");

	// Visible day on mobile device
	const [visibleDate, setVisibleDate] = React.useState(dayjs(date).date());

	const [isManageBookingDialogOpen, setIsManageBookingDialogOpen] = React.useState(false);
	const [selectedBooking, setSelectedBooking] = React.useState<BookingsByWeek[number] | undefined>(undefined);
	const [lastSelectedDate, setLastSelectedDate] = React.useState<dayjs.Dayjs | undefined>(undefined);

	const [isPreviewCardOpen, setIsPreviewCardOpen] = React.useState(false);

	const viewportSize = useViewportSize();

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

	const prefersDarkMode = user?.organizationId !== "mslu0ytyi8i2g7u1rdvooe55";

	const bookingsOneDayOrLonger: Booking[] = [];
	const bookingsLessThanOneDay: Booking[] = [];

	if (bookings) {
		for (const booking of bookings) {
			const date = dayjs(booking.date);

			if (dayjs(booking.date).isBefore(startOfWeek) || dayjs(booking.date).isAfter(endOfWeek)) {
				continue;
			}

			if (date.date() !== date.add(booking.duration, "seconds").date()) {
				bookingsOneDayOrLonger.push(booking);
			} else {
				bookingsLessThanOneDay.push(booking);
			}
		}
	}

	return (
		<div className="relative w-full">
			<div
				className={cn(
					"w-full px-1 pt-1",
					prefersDarkMode
						? "h-[calc(100vh-48px)] lg:h-[calc(100vh-80px)]"
						: "h-[calc(100vh-48px)] sm:h-[calc(100vh-96px)] md:h-[calc(100vh-112px)] lg:h-[calc(100vh-128px)]",
				)}
			>
				<div className="flex h-full flex-col space-y-4">
					<header className="flex flex-none flex-col justify-between gap-4  sm:flex-row sm:items-center">
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
						<div className="flex items-center justify-between gap-x-3 md:gap-x-5">
							<div className="relative flex items-center bg-white shadow-sm md:items-stretch">
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
									<Link href={`/calendar/week`}>Today</Link>
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

							<Separator orientation="vertical" className="hidden h-4 sm:block" />

							<ManageBookingDialog trigger={<Button size="sm">Create Booking</Button>} bookingTypes={bookingTypes} />
						</div>
					</header>
					<div
						ref={container}
						className={cn(
							"isolate flex flex-auto flex-col overflow-auto border bg-white",
							prefersDarkMode ? "md:rounded-md" : "rounded-md",
						)}
					>
						<div style={{ width: "165%" }} className="flex max-w-full flex-none flex-col sm:max-w-none lg:max-w-full">
							<div
								ref={containerNav}
								className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black/5  sm:pr-8"
							>
								<div className="m-1 grid grid-cols-7 text-sm leading-6 text-gray-500 sm:-mr-px sm:divide-x sm:divide-gray-100 sm:border-r sm:border-gray-100 ">
									{["M", "T", "W", "Th", "F", "S", "Su"].map((day, index) => {
										const date = startOfWeek.add(index, "day");
										return (
											<button
												key={day}
												type="button"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													setVisibleDate(date.date());
												}}
												className={cn(
													"sm:hidden flex flex-col items-center pb-3 pt-2 rounded-md focus-visible:relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
													date.date() === visibleDate && "bg-primary text-primary-foreground ",
												)}
											>
												{day}
												<span
													className={cn(
														"mt-1 flex h-8 w-8 items-center justify-center font-semibold",
														date.date() === visibleDate ? "text-white" : "text-primary",
													)}
												>
													{date.date()}
												</span>
											</button>
										);
									})}
									<div className="col-end-1 hidden w-14 sm:block" />
									{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
										const date = startOfWeek.add(index, "day");
										return (
											<div key={day} className={cn(" items-center justify-center py-2 xl:py-3 hidden sm:flex")}>
												<span
													className={cn(
														date.isToday() ? "bg-primary text-primary-foreground rounded-md text-center px-3 py-1" : "",
													)}
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
									{groupOverlappingBookings(bookingsOneDayOrLonger).map((bookingGroup) => {
										return bookingGroup.map((booking) => {
											const bookingStart = dayjs(booking.date);
											const bookingEnd = bookingStart.add(booking.duration, "seconds");

											const bookingType = bookingTypes.find((bookingType) => bookingType.id === booking.bookingTypeId);
											const colors =
												bookingType && bookingType?.color in bookingCardColors
													? bookingCardColors[bookingType.color as keyof typeof bookingCardColors]
													: { card: "border-violet-200 bg-violet-50 hover:bg-violet-100", text: "text-violet-700" };

											return (
												<div
													key={booking.id}
													className={cn(
														bookingStart.date() === visibleDate || bookingEnd.date() === visibleDate
															? "flex"
															: "hidden",
														"relative mt-px sm:flex col-start-1",
													)}
													style={{
														gridColumn:
															viewportSize.width >= 640
																? `span ${bookingEnd.day() - bookingStart.day() + 1} / span ${
																		bookingEnd.day() - bookingStart.day() + 1
																  }`
																: "span 7 / span 7",
														gridColumnStart:
															viewportSize.width >= 640
																? bookingStart.day() === 0
																	? 7
																	: bookingStart.day()
																: undefined,
														width:
															bookingStart.day() === 0 && viewportSize.width >= 640 ? `calc(100% + 1.5rem)` : undefined,
													}}
												>
													<BookingPopover
														booking={booking}
														onEditClick={(booking) => {
															setIsManageBookingDialogOpen(true);
															setSelectedBooking(booking);
														}}
														setIsPreviewCardOpen={setIsPreviewCardOpen}
														trigger={
															<button
																className={cn(
																	"group inset-1 w-full flex overflow-hidden whitespace-normal rounded-lg border p-2 text-xs leading-5 gap-1",
																	colors.card,
																)}
																onClick={(e) => {
																	e.stopPropagation();
																}}
															>
																<p
																	className={cn(
																		"max-w-full shrink-0 truncate whitespace-normal text-left font-semibold leading-none break-words",
																		colors.text,
																	)}
																>
																	{booking.dog && (
																		<>
																			{booking.dog.givenName} {booking.dog.familyName}
																		</>
																	)}
																	{bookingType && booking.dog && " - "}
																	{bookingType && bookingType.name}
																	{!bookingType && !booking.dog && "Default Booking"}
																	<span className="font-normal">
																		{" "}
																		&bull; {bookingStart.format("h:mma")}{" "}
																		<span className="lg:hidden xl:inline">- {bookingEnd.format("h:mma")}</span>
																	</span>
																</p>
															</button>
														}
													/>
												</div>
											);
										});
									})}
								</div>
							</div>
							<div className="flex flex-auto">
								<div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
								<div className="grid flex-auto grid-cols-1 grid-rows-1">
									{/* Horizontal lines */}
									<div
										className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
										style={{ gridTemplateRows: "repeat(48, minmax(3.5rem, 1fr))" }}
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
										bookingTypes={bookingTypes}
									/>

									{/* Events */}
									<ol
										className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7 sm:pr-8"
										style={{ gridTemplateRows: "1.75rem repeat(288, minmax(0, 1fr)) auto" }}
										onClick={(event) => {
											if (isPreviewCardOpen) {
												return;
											}

											const div = event.currentTarget;
											const rect = div.getBoundingClientRect();

											const offsetX = event.clientX - rect.left;
											const offsetY = event.clientY - rect.top - 16;

											if (offsetY < 0) {
												return;
											}

											const day = Math.floor(offsetX / ((rect.width - 32) / 7));
											const timeRounded = Math.floor(((offsetY - 16) / 112) * 2) / 2;

											const date = startOfWeek.startOf("day").add(day, "day").add(timeRounded, "hour");

											setIsManageBookingDialogOpen(true);
											setLastSelectedDate(date);
										}}
									>
										{groupOverlappingBookings(bookingsLessThanOneDay).map((bookingGroup) => {
											return bookingGroup.map((booking, index) => {
												const bookingStart = dayjs(booking.date);
												// Convert time to fraction. e.g. 10:30 AM => 10.5
												const time = bookingStart.hour() + bookingStart.minute() / 60;

												const bookingType = bookingTypes.find(
													(bookingType) => bookingType.id === booking.bookingTypeId,
												);
												const colors =
													bookingType && bookingType?.color in bookingCardColors
														? bookingCardColors[bookingType.color as keyof typeof bookingCardColors]
														: { card: "border-violet-200 bg-violet-50 hover:bg-violet-100", text: "text-violet-700" };

												return (
													<li
														key={booking.id}
														className={cn(
															bookingStart.date() === visibleDate ? "flex" : "hidden",
															"relative mt-px sm:flex col-start-1",
															colStartClasses.at(bookingStart.day()),
														)}
														style={{
															gridRow: `${Math.floor((288 / 24) * time + 1)} / span ${
																Math.floor((booking.duration / 60) * 0.2) || 1
															}`,
															width:
																bookingGroup.length > 1
																	? `calc(${100 / bookingGroup.length}% + ${18 * (index || 1)}px)`
																	: undefined,
															marginLeft:
																index > 0
																	? `calc(${(100 / bookingGroup.length) * index}% - ${18 * index}px)`
																	: undefined,
														}}
													>
														<BookingPopover
															booking={booking}
															onEditClick={(booking) => {
																setIsManageBookingDialogOpen(true);
																setSelectedBooking(booking);
															}}
															setIsPreviewCardOpen={setIsPreviewCardOpen}
															trigger={
																<button
																	className={cn(
																		"group absolute inset-1 flex flex-col overflow-hidden whitespace-normal rounded-lg border p-2 text-xs leading-5",
																		colors.card,
																	)}
																	onClick={(e) => {
																		e.stopPropagation();
																	}}
																>
																	<p
																		className={cn(
																			"max-w-full shrink-0 truncate whitespace-normal text-left font-semibold leading-none break-words",
																			colors.text,
																		)}
																	>
																		{booking.dog && (
																			<>
																				{booking.dog.givenName} {booking.dog.familyName}
																			</>
																		)}
																		{bookingType && booking.dog && " - "}
																		{bookingType && bookingType.name}
																		{!bookingType && !booking.dog && "Default Booking"}
																	</p>
																	<p className={cn("max-w-full truncate whitespace-normal text-left", colors.text)}>
																		{secondsToHumanReadable(booking.duration)}
																	</p>
																</button>
															}
														/>
													</li>
												);
											});
										})}
									</ol>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

type BookingPopoverProps = {
	booking: BookingsByWeek[number];
	trigger: React.ReactNode;
	onEditClick: (booking: BookingsByWeek[number]) => void;
	setIsPreviewCardOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

function BookingPopover({ booking, trigger, onEditClick, setIsPreviewCardOpen }: BookingPopoverProps) {
	const bookingStart = dayjs(booking.date);
	const bookingEnd = bookingStart.add(booking.duration, "seconds");
	return (
		<Popover
			onOpenChange={(value) => {
				if (value === false) {
					setTimeout(() => {
						setIsPreviewCardOpen(false);
					}, 205);
				}

				setIsPreviewCardOpen(true);
			}}
		>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="grid gap-4">
					<div className="flex w-[286px] items-start justify-between">
						<div className="max-w-full space-y-1">
							<h4 className="text-sm font-medium leading-none">
								{bookingStart.day() !== bookingEnd.day() ? (
									<>
										{bookingStart.format("MMMM Do, YYYY, h:mma")} - {bookingEnd.format("MMMM Do, YYYY, h:mma")}
									</>
								) : (
									<>
										{bookingStart.format("h:mm")}
										{bookingStart.format("a") !== bookingEnd.format("a") ? bookingStart.format("a") : ""} -{" "}
										{bookingEnd.format("h:mma")} &bull; {bookingStart.format("MMMM Do")}
									</>
								)}
							</h4>

							<p className="max-w-full text-xs text-muted-foreground">
								Assigned to{" "}
								{booking.assignedTo
									? `${booking.assignedTo.givenName} ${booking.assignedTo.familyName}`
									: "Deleted User"}{" "}
							</p>
						</div>
						<div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									onEditClick(booking);
								}}
								className="-mr-2.5 -mt-2.5"
							>
								<span className="sr-only">Edit Booking</span>
								<EditIcon className="h-4 w-4" aria-hidden="true" />
							</Button>
						</div>
					</div>
					<div className="grid gap-4">
						{booking.dog && (
							<div className="grid gap-y-2">
								<Label htmlFor="dog">Dog</Label>
								<Button variant="ghost" asChild className="-ml-4 h-auto w-[318px] justify-between rounded-none">
									<Link href={`/dog/${booking.dog.id}`}>
										<div className="flex max-w-full shrink items-center gap-x-2 truncate">
											<div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50">
												<DogIcon className="h-5 w-5" />
											</div>
											<div className="min-w-0 flex-auto">
												<p className="truncate text-sm font-semibold capitalize leading-6 text-primary">
													{booking.dog.givenName} {booking.dog.familyName}
												</p>
												<p className="truncate text-xs capitalize leading-5 text-slate-500">{booking.dog.color}</p>
											</div>
										</div>
										<div className="flex space-x-4 text-muted-foreground">
											<span className="sr-only">Edit dog</span>
											<ChevronRightIcon className="h-4 w-4" />
										</div>
									</Link>
								</Button>
							</div>
						)}
						<div className="grid gap-y-2">
							<Label htmlFor="details">Details</Label>
							{booking.details ? (
								<div
									className="prose prose-sm w-[286px] whitespace-pre-wrap"
									dangerouslySetInnerHTML={{ __html: booking.details }}
								/>
							) : (
								<div className="prose prose-sm whitespace-pre-wrap">
									<p className="italic text-slate-500">No details provided.</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export { WeekView };
