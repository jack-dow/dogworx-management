"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { parseDate } from "chrono-node";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import ms from "ms";
import { useFormContext } from "react-hook-form";

import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { actions, type BookingById } from "~/actions";
import { useUser } from "~/app/(dashboard)/providers";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { CalendarIcon, ChevronUpDownIcon, PlusIcon } from "../ui/icons";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RichTextEditor } from "../ui/rich-text-editor";
import { SearchCombobox, SearchComboboxAction } from "../ui/search-combobox";
import { TimeInput } from "../ui/time-input";
import { type ManageBookingFormSchemaType } from "./manage-booking";

dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

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

function roundDateToNearest15Minutes(date: Date) {
	const originalDate = dayjs(date);
	const currentMinute = originalDate.minute();

	// Calculate the number of minutes needed to round to the nearest 15 minutes
	const minutesToNext15 = currentMinute % 15 <= 7.5 ? -(currentMinute % 15) : 15 - (currentMinute % 15);

	// Adjust the date by adding or subtracting the calculated minutes
	const roundedDate = originalDate.add(minutesToNext15, "minute");

	return roundedDate.toDate();
}

function secondsToHumanReadable(seconds: number): string {
	if (seconds === 86400) {
		return "1 day";
	}
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	const formattedTime = [];
	if (hours > 0) {
		formattedTime.push(`${hours} hour${hours > 1 ? "s" : ""}`);
	}
	if (minutes > 0) {
		formattedTime.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
	}
	if (remainingSeconds > 0 || formattedTime.length === 0) {
		formattedTime.push(`${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`);
	}

	return formattedTime.join(", ");
}

function BookingFields({ dog }: { variant: "dialog" | "form"; dog?: BookingById["dog"] }) {
	const router = useRouter();

	const user = useUser();
	const form = useFormContext<ManageBookingFormSchemaType>();

	const [dateInputValue, setDateInputValue] = React.useState("");
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
	const [month, setMonth] = React.useState<Date>(dayjs(form.getValues("date")).toDate());

	const [timeInputValue, setTimeInputValue] = React.useState(
		form.getValues("date") ? dayjs(form.getValues("date")).format("HH:mm") : "",
	);

	const [durationInputValue, setDurationInputValue] = React.useState(
		form.getValues("duration") ? ms(form.getValues("duration") * 1000, { long: true }) : "",
	);

	return (
		<>
			<FormField
				control={form.control}
				name="date"
				render={({ field }) => {
					const date = dayjs(field.value);
					return (
						<div className="grid grid-cols-3 gap-4">
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

														const today = dayjs().toDate();
														const parsedValue = parseDate(val);
														const newDate = roundDateToNearest15Minutes(parsedValue ?? today);

														if (form.formState.errors.details && newDate >= today) {
															form.clearErrors("details");
														}

														field.onChange(newDate);
														setTimeInputValue(newDate ? dayjs(newDate).format("HH:mm") : "");
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
												selected={dayjs(field.value).toDate() ?? undefined}
												month={month}
												onMonthChange={setMonth}
												onSelect={(value) => {
													if (value) {
														if (form.formState.errors.details && value >= new Date()) {
															form.clearErrors("details");
														}

														field.onChange(value);
														setTimeInputValue(dayjs(value).format("HH:mm"));
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
												const date = dayjs(form.getValues("date"));
												const time = dayjs(value, "HH:mm");
												const newDate = date.set("hour", time.hour()).set("minute", time.minute());
												field.onChange(newDate.toDate());
											}
										}}
									/>
								</FormControl>
							</FormItem>
						</div>
					);
				}}
			/>

			<FormField
				control={form.control}
				name="duration"
				render={({ field }) => (
					<FormItem>
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

			<FormField
				control={form.control}
				name="dogId"
				render={({ field }) => {
					const defaultSelected = dog ?? form.getValues("dog");
					return (
						<FormItem>
							<FormLabel>Dog</FormLabel>
							<FormControl>
								<SearchCombobox
									disabled={dog !== undefined}
									placeholder="Select dog"
									onSearch={async (searchTerm) => {
										const result = await actions.app.dogs.search(searchTerm);

										if (!result.success) {
											throw new Error("Failed to search dogs");
										}

										return result.data;
									}}
									resultLabel={(result) => `${result.givenName} ${result.familyName}`}
									onSelectChange={(result) => {
										field.onChange(result?.id);
									}}
									renderActions={({ searchTerm }) => (
										<SearchComboboxAction
											onSelect={() => {
												router.push(`/dog/new${searchTerm ? `?searchTerm=${searchTerm}` : ""}`);
											}}
										>
											<PlusIcon className="mr-1 h-4 w-4" />
											<span className="truncate">Create new dog {searchTerm && `"${searchTerm}"`}</span>
										</SearchComboboxAction>
									)}
									defaultSelected={defaultSelected}
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
								onSearch={async (searchTerm) => {
									const result = await actions.app.users.search(searchTerm);

									if (!result.success) {
										throw new Error("Failed to search users");
									}

									return result.data;
								}}
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
								defaultSelected={form.getValues("assignedTo")}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="details"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Session details</FormLabel>
						<FormControl>
							<RichTextEditor
								id="booking-details"
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
