"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { parseDate } from "chrono-node";
import ms from "ms";
import { useFormContext } from "react-hook-form";

import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useUser } from "~/app/providers";
import { useDayjs, type Dayjs } from "~/hooks/use-dayjs";
import { api } from "~/lib/trpc/client";
import { type RouterOutputs } from "~/server";
import { cn, secondsToHumanReadable } from "~/utils";
import { BOOKING_TYPES_COLORS } from "../manage-booking-types/booking-types-fields";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { CalendarIcon, ChevronUpDownIcon, PlusIcon } from "../ui/icons";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RichTextEditor } from "../ui/rich-text-editor";
import { SearchCombobox, SearchComboboxAction } from "../ui/search-combobox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { TimeInput } from "../ui/time-input";
import { type ManageBookingFormSchema } from "./use-manage-booking-form";

function convertToNumber(input: string): number | null {
	// Step 1: Remove leading and trailing whitespace
	const trimmedInput = input.trim();

	// Step 2: Check if the string contains only digits and an optional decimal point
	const isNumeric = /^-?\d+(\.\d+)?$/.test(trimmedInput);

	if (!isNumeric) {
		return null; // Not a valid number
	}

	// Step 3: Convert the string to a number and return its absolute value
	const numericValue = parseFloat(trimmedInput);
	return Math.abs(numericValue);
}

function roundDateToNearest15Minutes(dayjs: Dayjs, date: Date) {
	const originalDate = dayjs.tz(date);
	const currentMinute = originalDate.minute();

	// Calculate the number of minutes needed to round to the nearest 15 minutes
	const minutesToNext15 = currentMinute % 15 <= 7.5 ? -(currentMinute % 15) : 15 - (currentMinute % 15);

	// Adjust the date by adding or subtracting the calculated minutes
	const roundedDate = originalDate.add(minutesToNext15, "minute").set("second", 0);

	return roundedDate.toDate();
}

function BookingFields({
	disableDogSearch,
	bookingTypes,
	booking,
}: {
	variant: "dialog" | "form";
	disableDogSearch?: boolean;
	booking: RouterOutputs["app"]["bookings"]["byId"]["data"];
	bookingTypes: RouterOutputs["app"]["bookingTypes"]["all"]["data"];
}) {
	const { dayjs } = useDayjs();
	const router = useRouter();

	const user = useUser();
	const form = useFormContext<ManageBookingFormSchema>();

	const [dateInputValue, setDateInputValue] = React.useState("");
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
	const [month, setMonth] = React.useState<Date>(dayjs.tz(form.getValues("date")).toDate());

	const [timeInputValue, setTimeInputValue] = React.useState(
		form.getValues("date") ? dayjs.tz(form.getValues("date")).format("HH:mm") : "",
	);

	const [durationInputValue, setDurationInputValue] = React.useState(
		form.getValues("duration") ? ms(form.getValues("duration") * 1000, { long: true }) : "",
	);

	const [dogsSearchTerm, setDogsSearchTerm] = React.useState("");
	const dogSearch = api.app.dogs.search.useQuery({ searchTerm: dogsSearchTerm }, { enabled: Boolean(dogsSearchTerm) });

	const [assignedToSearchTerm, setAssignedToSearchTerm] = React.useState("");
	const assignedToSearch = api.auth.organizations.users.search.useQuery(
		{ searchTerm: assignedToSearchTerm },
		{ enabled: Boolean(assignedToSearchTerm) },
	);

	return (
		<>
			<FormField
				control={form.control}
				name="bookingTypeId"
				render={({ field }) => (
					<FormItem className="w-full">
						<FormLabel>Booking Type</FormLabel>
						<Select
							onValueChange={(value) => {
								field.onChange(value);
							}}
							value={field.value ?? undefined}
						>
							<FormControl>
								<SelectTrigger className={cn("relative")}>
									<SelectValue placeholder="Default Booking">
										<span className="truncate capitalize">
											{!field.value
												? "Default Booking"
												: bookingTypes.find((bookingType) => bookingType.id === field.value)!.name}
										</span>
									</SelectValue>
								</SelectTrigger>
							</FormControl>
							<SelectContent align="start" className="max-w-[350px]">
								<SelectGroup>
									<SelectLabel>Booking types</SelectLabel>
									<SelectItem value="" className={"pl-8 capitalize"}>
										<div
											className={cn(
												"w-4 h-4 rounded-full absolute mt-0.5 left-2 flex items-center justify-center bg-violet-200",
											)}
										/>
										Default Booking
									</SelectItem>

									{bookingTypes?.map((bookingType) => (
										<SelectItem
											key={bookingType.id}
											value={bookingType.id}
											className={cn("capitalize", bookingType.color in BOOKING_TYPES_COLORS && "pl-8")}
											onClick={() => {
												if (form.getValues("duration") !== bookingType.duration) {
													form.setValue("duration", bookingType.duration, { shouldDirty: true });
													setDurationInputValue(ms(bookingType.duration * 1000, { long: true }));
												}
											}}
										>
											<div
												className={cn(
													"w-4 h-4 rounded-full absolute mt-0.5 left-2 flex items-center justify-center",
													bookingType.color in BOOKING_TYPES_COLORS &&
														BOOKING_TYPES_COLORS[bookingType.color as keyof typeof BOOKING_TYPES_COLORS],
												)}
											/>
											{bookingType.name}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="grid grid-cols-3 gap-4">
				<FormField
					control={form.control}
					name="date"
					render={({ field }) => {
						const date = dayjs.tz(field.value);
						return (
							<>
								<FormItem className="col-span-2">
									<FormLabel>Date</FormLabel>
									<FormControl>
										<Popover
											open={isDatePickerOpen}
											onOpenChange={(value) => {
												setIsDatePickerOpen(value);
												if (value === false) {
													// Wait for popover to animate out before resetting
													setTimeout(() => {
														setMonth(new Date());
														setDateInputValue("");
													}, 150);
												}
											}}
										>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className="h-10 w-full focus-visible:outline-1 focus-visible:outline-offset-0"
												>
													<CalendarIcon className="mr-2 h-4 w-4" />
													<span className="mr-2 truncate">
														{field.value ? date.format("MMMM Do, YYYY") : "Select date"}
													</span>
													<ChevronUpDownIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" withoutPortal>
												<div className="space-y-2 p-3 pb-1">
													<Label htmlFor="booking-date-input">Date</Label>
													<Input
														id="booking-date-input"
														autoComplete="off"
														value={dateInputValue}
														onChange={(e) => {
															const val = e.target.value;
															setDateInputValue(val);

															const today = dayjs.tz().toDate();
															const parsedValue = parseDate(val);
															const newDate = roundDateToNearest15Minutes(dayjs, parsedValue ?? today);

															if (form.formState.errors.details && newDate >= today) {
																form.clearErrors("details");
															}

															field.onChange(newDate);
															setTimeInputValue(newDate ? dayjs.tz(newDate).format("HH:mm") : "");
															setMonth(newDate);
														}}
														onKeyDown={(e) => {
															if (e.key === "Enter") {
																e.preventDefault();
																e.stopPropagation();
																setIsDatePickerOpen(false);
															}
														}}
													/>
												</div>
												<Calendar
													mode="single"
													selected={field.value ? dayjs.tz(field.value).toDate() : undefined}
													month={month}
													onMonthChange={setMonth}
													onSelect={(value) => {
														if (value) {
															if (form.formState.errors.details && value >= new Date()) {
																form.clearErrors("details");
															}

															const current = dayjs.tz(field.value);
															const date = dayjs.tz(value);
															const now = dayjs.tz();

															const val = roundDateToNearest15Minutes(
																dayjs,
																field.value && timeInputValue
																	? date.set("hour", current.hour()).set("minute", current.minute()).toDate()
																	: date.set("hour", now.hour()).set("minute", now.minute()).toDate(),
															);

															field.onChange(val);
															setTimeInputValue(dayjs.tz(val).format("HH:mm"));
														}
														setIsDatePickerOpen(false);
														setDateInputValue("");
													}}
													initialFocus={false}
												/>
											</PopoverContent>
										</Popover>
									</FormControl>
									<FormMessage />
								</FormItem>

								<FormItem className="flex-1">
									<FormLabel>Start Time</FormLabel>
									<FormControl>
										<TimeInput
											className="h-10"
											step={900}
											value={timeInputValue}
											onChange={(value) => {
												setTimeInputValue(value);

												if (value) {
													const date = dayjs.tz(form.getValues("date"));
													const time = dayjs(value, "HH:mm");
													const newDate = date.set("hour", time.hour()).set("minute", time.minute());
													field.onChange(newDate.toDate());
												}
											}}
										/>
									</FormControl>
								</FormItem>
							</>
						);
					}}
				/>
			</div>
			<FormField
				control={form.control}
				name="duration"
				render={({ field }) => (
					<FormItem className="col-span-3 xl:col-span-1">
						<FormLabel>Duration</FormLabel>
						<FormControl>
							<Input
								autoComplete="off"
								value={durationInputValue}
								onChange={(e) => {
									setDurationInputValue(e.target.value);

									const value = convertToNumber(e.target.value) ?? e.target.value;

									if (value) {
										// If value is just a number, assume it is in minutes
										if (typeof value === "number") {
											field.onChange(value * 60, { shouldValidate: true });
										} else {
											// Otherwise see if it is a valid time
											let parsed = ms(value);

											if (parsed > 86400000) {
												parsed = 86400000;
											}

											// If it's a valid time, convert it to seconds and set it
											if (parsed) {
												field.onChange(parsed / 1000, { shouldValidate: true });
											}
										}
									}
								}}
								onBlur={() => {
									if (!durationInputValue) {
										field.onChange(undefined);
										return;
									}

									const duration = form.getValues("duration");

									if (duration) {
										setDurationInputValue(secondsToHumanReadable(duration));
										return;
									}

									setDurationInputValue("");
								}}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="grid gap-4 xl:grid-cols-2">
				<FormField
					control={form.control}
					name="dogId"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Dog</FormLabel>
								<FormControl>
									<SearchCombobox
										disabled={disableDogSearch}
										placeholder={disableDogSearch ? "Current Dog" : "Select dog"}
										onSearchTermChange={(searchTerm) => {
											setDogsSearchTerm(searchTerm);
										}}
										results={dogSearch.data?.data ?? []}
										isFetching={!!dogsSearchTerm && dogSearch.isFetching}
										resultLabel={(result) => `${result.givenName ?? "Unnamed Dog"} ${result.familyName}`}
										onSelectChange={(result) => {
											field.onChange(result?.id ?? "");
										}}
										renderActions={({ searchTerm }) => (
											<SearchComboboxAction
												onSelect={() => {
													router.push(`/dogs/new${searchTerm ? `?searchTerm=${searchTerm}` : ""}`);
												}}
											>
												<PlusIcon className="mr-1 h-4 w-4" />
												<span className="truncate">Create new dog {searchTerm && `"${searchTerm}"`}</span>
											</SearchComboboxAction>
										)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>

				<FormField
					control={form.control}
					name="assignedToId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Assigned to</FormLabel>
							<FormControl>
								<SearchCombobox
									placeholder="Select user"
									onSearchTermChange={(searchTerm) => {
										setAssignedToSearchTerm(searchTerm);
									}}
									results={assignedToSearch.data?.data ?? []}
									isFetching={!!assignedToSearchTerm && assignedToSearch.isFetching}
									onBlur={({ setSearchTerm, setSelected, setResults }) => {
										if (!form.getValues("assignedToId")) {
											field.onChange(user?.id);
											setSearchTerm(`${user.givenName} ${user.familyName}`);
											setSelected(user);
											setResults([user]);
										}
									}}
									resultLabel={(result) => `${result.givenName} ${result.familyName}`}
									onSelectChange={(result) => {
										field.onChange(result?.id);
									}}
									defaultSelected={booking?.assignedToId ? booking.assignedTo ?? undefined : user}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={form.control}
				name="details"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Booking details</FormLabel>
						<FormControl>
							<RichTextEditor
								content={field.value ?? undefined}
								onValueChange={({ html, text }) => {
									if (text === "") {
										field.onChange(text);
									} else {
										field.onChange(html);
									}
								}}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}

export { BookingFields };
