"use client";

import * as React from "react";
import { parseDate } from "chrono-node";
import { useFormContext } from "react-hook-form";

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
import { useDayjs, type Dayjs } from "~/hooks/use-dayjs";
import { cn } from "~/lib/utils";
import { ManageDogFormSchema } from "./manage-dog-form";

function DogBasicInformation() {
	const form = useFormContext<ManageDogFormSchema>();
	return (
		<FormSection
			title="Basic Information"
			description="This information will be used throughout the app to identify this dog. Add any other relevant information about this dog in the notes section."
		>
			<FormGroup>
				<div className="sm:col-span-3 md:col-span-2">
					<FormField
						control={form.control}
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

				<div className="sm:col-span-3 md:col-span-2">
					<FormField
						control={form.control}
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

				<div className="sm:col-span-3 md:col-span-2">
					<FormField
						control={form.control}
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

				<div className="space-y-2 sm:col-span-3 md:col-span-2">
					<BirthdayInputCalendar />
					<FormField
						control={form.control}
						name="isAgeEstimate"
						render={({ field }) => (
							<FormItem className="flex items-center space-x-2 space-y-0">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={(checked) => {
											field.onChange(checked);
										}}
									/>
								</FormControl>
								<FormLabel>Birthday is estimate</FormLabel>
							</FormItem>
						)}
					/>
				</div>

				<div className="sm:col-span-3 md:col-span-2">
					<FormField
						control={form.control}
						name="sex"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Sex</FormLabel>
								<Select
									onValueChange={(value) => {
										field.onChange(value as typeof field.value);
									}}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a sex">
												<span className={cn(field.value && "capitalize")}>{field.value}</span>
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

				<div className="sm:col-span-3 md:col-span-2">
					<FormField
						control={form.control}
						name="desexed"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Desexed</FormLabel>
								<FormControl>
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
						control={form.control}
						name="notes"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Notes</FormLabel>
								<FormControl>
									<RichTextEditor content={field.value ?? ""} onValueChange={({ html }) => field.onChange(html)} />
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

function getAgeInWords(dayjs: Dayjs, age: Date | null) {
	if (!age) return null;
	const now = dayjs.tz();
	const years = now.diff(age, "year");
	const months = now.diff(age, "month") - years * 12;
	const days = now.diff(dayjs.tz(age).add(years, "year").add(months, "month"), "day");

	if (years === 0 && months === 0) {
		if (days < 0) return "Not born yet";
		if (days < 7) return `${days} day${days !== 1 ? "s" : ""} old`;
		return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""} old`;
	} else {
		if (years === 0) return `${months} month${months !== 1 ? "s" : ""} old`;
		if (months === 0) return `${years} year${years !== 1 ? "s" : ""} old`;
		return `${years} year${years !== 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""} old`;
	}
}

function BirthdayInputCalendar() {
	const { dayjs } = useDayjs();
	const form = useFormContext<ManageDogFormSchema>();

	const [inputValue, setInputValue] = React.useState("");
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
	const [month, setMonth] = React.useState<Date>(form.getValues("age") ?? new Date());

	const [ageInWords, setAgeInWords] = React.useState<string | null>(getAgeInWords(dayjs, form.getValues("age")));

	return (
		<>
			<FormField
				control={form.control}
				name="age"
				render={({ field }) => (
					<FormItem>
						<div className="inline-flex w-full justify-between gap-x-2">
							<FormLabel>Birthday</FormLabel>
							{ageInWords && <span className="truncate text-xs text-muted-foreground">{ageInWords}</span>}
						</div>
						<FormControl>
							<Popover
								open={isDatePickerOpen}
								onOpenChange={(value) => {
									setIsDatePickerOpen(value);
								}}
							>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={isDatePickerOpen}
										className="w-full focus-visible:outline-1 focus-visible:outline-offset-0"
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										<span className="mr-2 truncate">
											{field.value ? dayjs.tz(field.value).format("MMMM Do, YYYY") : "Select date"}
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

												const date = parseDate(val) ?? new Date();

												field.onChange(date);
												setMonth(date);
												setAgeInWords(getAgeInWords(dayjs, date));
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
												setAgeInWords(getAgeInWords(dayjs, value));
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
