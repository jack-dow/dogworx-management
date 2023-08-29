"use client";

import * as React from "react";
import Link from "next/link";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import isToday from "dayjs/plugin/isToday";
import updateLocale from "dayjs/plugin/updateLocale";

import { ManageBookingDialog } from "~/components/manage-booking/manage-booking-dialog";
import { Button } from "~/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, DogIcon, EditIcon } from "~/components/ui/icons";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { type BookingsByWeek } from "~/actions";
import { useUser } from "~/app/(dashboard)/providers";
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

	const user = useUser();

	const startOfWeek = dayjs(date).startOf("week");
	const endOfWeek = dayjs(date).endOf("week");

	const prevWeek = dayjs(date).subtract(7, "days");
	const nextWeek = dayjs(date).add(7, "days");

	// Visible day on mobile device
	const [visibleDay, setVisibleDay] = React.useState(dayjs().day());

	const [isManageBookingDialogOpen, setIsManageBookingDialogOpen] = React.useState(false);
	const [selectedBooking, setSelectedBooking] = React.useState<BookingsByWeek[number] | undefined>(undefined);
	const [lastSelectedDate, setLastSelectedDate] = React.useState<dayjs.Dayjs | undefined>(undefined);

	const [isPreviewCardOpen, setIsPreviewCardOpen] = React.useState(false);

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

	return (
		<div className="relative w-full">
			<div
				className={cn(
					prefersDarkMode
						? "absolute -ml-6 h-[calc(100vh-96px)] w-screen sm:h-[calc(100vh-104px)] lg:-ml-0 lg:h-[calc(100vh-128px)] lg:w-full"
						: "w-full h-[calc(100vh-120px)] sm:h-[calc(100vh-176px)] md:h-[calc(100vh-192px)] lg:h-[calc(100vh-216px)]",
				)}
			>
				<div className="flex h-full flex-col space-y-4">
					<header
						className={cn(
							"flex flex-none flex-col justify-between gap-4 sm:items-center sm:flex-row",
							prefersDarkMode && "px-6 lg:px-0",
						)}
					>
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

							<ManageBookingDialog trigger={<Button size="sm">Create Booking</Button>} />
						</div>
					</header>
					<div
						ref={container}
						className={cn(
							"isolate flex flex-auto flex-col overflow-auto border bg-white",
							prefersDarkMode ? "md:rounded-md" : "rounded-md",
						)}
					>
						<div style={{ width: "165%" }} className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full">
							<div
								ref={containerNav}
								className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black/5  sm:pr-8"
							>
								<div className="m-1 grid grid-cols-7 text-sm leading-6 text-gray-500 sm:hidden">
									{["M", "T", "W", "Th", "F", "S", "Su"].map((day, index) => {
										const date = startOfWeek.add(index, "day");
										return (
											<button
												key={day}
												type="button"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													setVisibleDay(date.day());
												}}
												className={cn(
													"flex flex-col items-center pb-3 pt-2 rounded-md focus-visible:relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
													date.day() === visibleDay && "bg-primary text-primary-foreground ",
												)}
											>
												{day}
												<span
													className={cn(
														"mt-1 flex h-8 w-8 items-center justify-center font-semibold",
														date.day() === visibleDay ? "text-white" : "text-primary",
													)}
												>
													{date.date()}
												</span>
											</button>
										);
									})}
								</div>

								<div className="-mr-px hidden grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm leading-6 text-gray-500 sm:grid">
									<div className="col-end-1 w-14" />
									{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
										const date = startOfWeek.add(index, "day");
										return (
											<div key={day} className={cn("flex items-center justify-center py-3")}>
												<span
													className={cn(
														date.isToday() ? "bg-primary text-primary-foreground rounded-md px-3 py-1" : "",
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

											const day = Math.floor(offsetX / (rect.width / 7));
											const timeRounded = Math.floor(((offsetY - 16) / 80) * 2) / 2;

											const date = startOfWeek.startOf("day").add(day, "day").add(timeRounded, "hour");

											setIsManageBookingDialogOpen(true);
											setLastSelectedDate(date);
										}}
									>
										{bookings?.map((booking) => (
											<BookingCard
												key={booking.id}
												booking={booking}
												visibleDay={visibleDay}
												onEditClick={(booking) => {
													setIsManageBookingDialogOpen(true);
													setSelectedBooking(booking);
												}}
												setIsPreviewCardOpen={setIsPreviewCardOpen}
											/>
										))}
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

const colStartClasses = [
	"sm:col-start-1",
	"sm:col-start-2",
	"sm:col-start-3",
	"sm:col-start-4",
	"sm:col-start-5",
	"sm:col-start-6",
	"sm:col-start-7",
];

type BookingCardProps = {
	booking: BookingsByWeek[number];
	visibleDay: number;
	onEditClick: (booking: BookingsByWeek[number]) => void;
	setIsPreviewCardOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

function BookingCard({ booking, visibleDay, onEditClick, setIsPreviewCardOpen }: BookingCardProps) {
	const date = dayjs(booking.date);
	const end = date.add(booking.duration, "seconds");
	// Convert time to fraction. e.g. 10:30 AM => 10.5
	const time = date.hour() + date.minute() / 60;

	return (
		<li
			key={booking.id}
			className={cn(
				date.day() === visibleDay ? "flex" : "hidden",
				"relative mt-px sm:flex",
				colStartClasses[date.day() - 1],
			)}
			style={{
				gridRow: `${Math.floor((288 / 24) * time + 1)} / span ${(booking.duration / 60) * 0.2}`,
			}}
		>
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
				<PopoverTrigger asChild>
					<button
						className="group absolute inset-1 flex flex-col overflow-hidden rounded-lg bg-violet-50 px-2 py-1.5 text-xs leading-5 hover:bg-violet-100 "
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						<p className="truncate text-left text-violet-500 group-hover:text-violet-700">
							<time dateTime="2022-01-15T10:00">{date.format("h:mmA")}</time>
							<span className={cn(booking.duration < 2700 ? "sm:hidden" : "hidden 2xl:inline")}> - </span>
							<span className={cn(booking.duration < 2700 ? "sm:sr-only" : "sr-only 2xl:not-sr-only")}>
								{secondsToHumanReadable(booking.duration)}
							</span>
							<span className={cn(booking.duration < 2700 ? "hidden xl:inline" : "hidden")}> - </span>
							<span
								className={cn(
									booking.duration < 2700 ? "sm:hidden pl-1 sm:pl-0 font-semibold text-violet-700 xl:inline" : "hidden",
								)}
							>
								{booking.dog.givenName} {booking.dog.familyName}
							</span>
						</p>
						{booking.duration >= 2700 && (
							<p className="text-left font-semibold text-violet-700">
								{booking.dog.givenName} {booking.dog.familyName}
							</p>
						)}
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-80">
					<div className="grid gap-4">
						<div className="flex items-start justify-between">
							<div className="space-y-1">
								<h4 className="text-sm font-medium leading-none">
									{date.day() !== end.day() ? (
										<>
											{date.format("MMMM Do, YYYY, h:mma")} - {end.format("h:mma, MMMM Do, YYYY")}
										</>
									) : (
										<>
											{date.format("h:mm")}
											{date.format("a") !== end.format("a") ? date.format("a") : ""} - {end.format("h:mma")} &bull;{" "}
											{date.format("MMMM Do")}
										</>
									)}
								</h4>

								<p className="text-xs text-muted-foreground">
									Assigned to{" "}
									{booking.assignedTo
										? `${booking.assignedTo.givenName} ${booking.assignedTo.familyName}`
										: "Deleted User"}
								</p>
							</div>
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
						<div className="grid gap-4">
							<div className="grid gap-y-2">
								<Label htmlFor="dog">Dog</Label>
								<Button variant="ghost" asChild className="-ml-4 h-auto w-[calc(100%+32px)] justify-between">
									<Link href={`/dog/${booking.dog.id}`}>
										<div className="flex shrink items-center gap-x-2 truncate">
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
							<div className="grid gap-y-2">
								<Label htmlFor="details">Details</Label>
								{booking.details ? (
									<div
										className="prose prose-sm max-w-none whitespace-pre-wrap"
										dangerouslySetInnerHTML={{ __html: booking.details }}
									/>
								) : (
									<div className="prose prose-sm max-w-none whitespace-pre-wrap">
										<p className="italic text-slate-500">No details provided.</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</li>
	);
}

export { WeekView };
