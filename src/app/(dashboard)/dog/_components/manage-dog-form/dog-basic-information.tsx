"use client";

import * as React from "react";
import * as chrono from "chrono-node";
import dayjs from "dayjs";
import { useFormContext, type Control } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Checkbox } from "~/components/ui/checkbox";
import { FormControl, FormField, FormGroup, FormItem, FormLabel, FormMessage, FormSection } from "~/components/ui/form";
import { CalendarIcon, ChevronUpDownIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/utils";
import { ManageDogFormSchema } from "./manage-dog-form";

function DogBasicInformation({ control }: { control: Control<ManageDogFormSchema> }) {
	return (
		<FormSection
			title="Basic Information"
			description="The information you provide here will be used to create your dog's profile."
		>
			<FormGroup>
				<div className="sm:col-span-2">
					<FormField
						control={control}
						name="givenName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="sm:col-span-2">
					<FormField
						control={control}
						name="breed"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Breed</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="sm:col-span-2">
					<FormField
						control={control}
						name="color"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Color</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="mt-2 space-y-2 sm:col-span-2">
					<BirthdayInputCalendar control={control} />
					<FormField
						control={control}
						name="isAgeEstimate"
						render={({ field }) => (
							<FormItem className="flex items-center space-x-2 space-y-0">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={(checked) => {
											field.onChange(!checked);
										}}
									/>
								</FormControl>
								<FormLabel>Birthday is estimate</FormLabel>
							</FormItem>
						)}
					/>
				</div>

				<div className="sm:col-span-2">
					<FormField
						control={control}
						name="sex"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Sex</FormLabel>
								<Select
									onValueChange={(value) => {
										field.onChange(value as typeof field.value);
									}}
									value={field.value ?? ""}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue>
												{/* This is required because field is black for a second on page load otherwise */}
												<span className={cn(field.value && "capitalize")}>{field.value ?? "Select a sex"}</span>
											</SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.values(ManageDogFormSchema.shape.sex.Values).map((relation) => (
											<SelectItem key={relation} value={relation} className="capitalize">
												{relation}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="sm:col-span-2">
					<FormField
						control={control}
						name="desexed"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Desexed</FormLabel>
								<FormControl>
									{/* <SegmentedControl
												data={["Yes", "No"]}
												value={field.value ? "Yes" : "No"}
												onChange={(value) => {
													field.onChange(value === "Yes");
												}}
											/> */}
									<Tabs
										value={field.value ? "yes" : "no"}
										onValueChange={(value) => {
											field.onChange(value === "yes");
										}}
										className="w-full"
									>
										<TabsList className="grid w-full grid-cols-2">
											<TabsTrigger value="yes">Yes</TabsTrigger>
											<TabsTrigger value="no">No</TabsTrigger>
										</TabsList>
									</Tabs>
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="sm:col-span-6">
					<FormField
						control={control}
						name="notes"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Notes</FormLabel>
								<FormControl>
									<RichTextEditor content={field.value ?? ""} onHtmlValueChange={field.onChange} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</FormGroup>
		</FormSection>
	);
}

function getAgeInWords(age: Date | null) {
	if (!age) return null;
	const now = dayjs();
	const years = now.diff(age, "year");
	const months = now.diff(age, "month") - years * 12;
	const days = now.diff(dayjs(age).add(years, "year").add(months, "month"), "day");

	if (years === 0 && months === 0) {
		if (days < 0) {
			return "Not born yet";
		}
		if (days < 7) {
			return `${days} day${days !== 1 ? "s" : ""} old`;
		}
		return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""} old`;
	} else {
		if (years === 0) {
			return `${months} month${months !== 1 ? "s" : ""} old`;
		}

		if (months === 0) {
			return `${years} year${years !== 1 ? "s" : ""} old`;
		}

		return `${years} year${years !== 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""} old`;
	}
}

function BirthdayInputCalendar({ control }: { control: Control<ManageDogFormSchema> }) {
	const form = useFormContext<ManageDogFormSchema>();

	const [inputValue, setInputValue] = React.useState("");
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
	const [month, setMonth] = React.useState<Date>(form.getValues("age") ?? new Date());

	const [ageInWords, setAgeInWords] = React.useState<string | null>(getAgeInWords(form.getValues("age")));

	return (
		<>
			<FormField
				control={control}
				name="age"
				render={({ field }) => (
					<FormItem>
						<div className="flex justify-between">
							<FormLabel>Birthday</FormLabel>
							{ageInWords && <span className="text-xs text-muted-foreground">{ageInWords}</span>}
						</div>
						<FormControl>
							<Popover
								open={isDatePickerOpen}
								onOpenChange={(value) => {
									setIsDatePickerOpen(value);
								}}
							>
								<PopoverTrigger asChild>
									<Button variant="outline" role="combobox" aria-expanded={isDatePickerOpen} className="w-full">
										<CalendarIcon className="mr-2 h-4 w-4" />
										<span className="mr-2 truncate">
											{field.value ? dayjs(field.value).format("MMMM D, YYYY") : "Select a date"}
										</span>
										<ChevronUpDownIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<div className="space-y-2 p-3 pb-1">
										<Label htmlFor="birthday-date-input">Date</Label>
										<Input
											id="birthday-date-input"
											autoComplete="off"
											value={inputValue}
											onChange={(e) => {
												const val = e.target.value;
												setInputValue(val);

												const date = chrono.parseDate(val) ?? new Date();

												field.onChange(date);
												setMonth(date);
												setAgeInWords(getAgeInWords(date));
											}}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													setIsDatePickerOpen(false);
												}
											}}
										/>
									</div>
									<Calendar
										mode="single"
										selected={field.value ?? undefined}
										month={month}
										onMonthChange={setMonth}
										onSelect={(value) => {
											if (value) {
												field.onChange(value);
												setAgeInWords(getAgeInWords(value));
											}
											setIsDatePickerOpen(false);
										}}
										initialFocus={false}
									/>
								</PopoverContent>
							</Popover>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}

export { DogBasicInformation };
