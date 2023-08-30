"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";

import { cn } from "~/utils";
import {
	FormControl,
	FormField,
	FormGroup,
	FormItem,
	FormLabel,
	FormMessage,
	FormSection,
	FormSheetGroup,
} from "../ui/form";
import { Input } from "../ui/input";
import { RichTextEditor } from "../ui/rich-text-editor";
import { type ManageClientFormSchema } from "./use-manage-client-form";

function ClientPersonalInformation({ variant }: { variant: "sheet" | "form" }) {
	const form = useFormContext<ManageClientFormSchema>();

	const SectionWrapper = variant === "sheet" ? FormSheetGroup : FormSection;
	const FieldsWrapper = variant === "sheet" ? React.Fragment : FormGroup;

	return (
		<SectionWrapper
			title="Personal Information"
			description="This information will be used throughout the app to identify this client. Add any other relevant information about this client in the notes section."
		>
			<FieldsWrapper>
				<div className="sm:col-span-3">
					<FormField
						control={form.control}
						name="givenName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>First Name</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} autoComplete="off" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="sm:col-span-3">
					<FormField
						control={form.control}
						name="familyName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Last Name</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} autoComplete="off" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="sm:col-span-3">
					<FormField
						control={form.control}
						name="emailAddress"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email Address</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value ?? ""}
										onChange={(e) => {
											field.onChange(e);
											if (form.formState.errors.phoneNumber?.type === "too_small") {
												form.clearErrors("phoneNumber");
											}
										}}
										autoComplete="off"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="sm:col-span-3">
					<FormField
						control={form.control}
						name="phoneNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Phone Number</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value ?? ""}
										onChange={(e) => {
											field.onChange(e.target.value);
											if (form.formState.errors.emailAddress?.type === "too_small") {
												form.clearErrors("emailAddress");
											}
										}}
										autoComplete="off"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div
					className={cn(
						variant === "sheet" ? "sm:col-span-full" : "sm:col-span-6 md:col-span-3 lg:col-span-6 xl:col-span-3",
					)}
				>
					<FormField
						control={form.control}
						name="streetAddress"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Street Address</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} autoComplete="off" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div
					className={cn(
						variant === "sheet" ? "sm:col-span-2" : "sm:col-span-2 md:col-span-1 lg:col-span-2 xl:col-span-1",
					)}
				>
					<FormField
						control={form.control}
						name="city"
						render={({ field }) => (
							<FormItem>
								<FormLabel>City</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} autoComplete="off" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div
					className={cn(
						variant === "sheet" ? "sm:col-span-2" : "sm:col-span-2 md:col-span-1 lg:col-span-2 xl:col-span-1",
					)}
				>
					<FormField
						control={form.control}
						name="state"
						render={({ field }) => (
							<FormItem>
								<FormLabel>State</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} autoComplete="off" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div
					className={cn(
						variant === "sheet" ? "sm:col-span-2" : "sm:col-span-2 md:col-span-1 lg:col-span-2 xl:col-span-1",
					)}
				>
					<FormField
						control={form.control}
						name="postalCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Postal Code</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} autoComplete="off" />
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
			</FieldsWrapper>
		</SectionWrapper>
	);
}

export { ClientPersonalInformation };
