"use client";

import * as React from "react";
import { useFormContext, type Control } from "react-hook-form";

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
import { type ManageVetFormSchema } from "./manage-vet";

function VetContactInformation({
	control,
	variant,
}: {
	control: Control<ManageVetFormSchema>;
	variant: "sheet" | "form";
}) {
	const form = useFormContext<ManageVetFormSchema>();

	const SectionWrapper = variant === "sheet" ? FormSheetGroup : FormSection;
	const FieldsWrapper = variant === "sheet" ? React.Fragment : FormGroup;

	return (
		<SectionWrapper title="Contact Information" description="The name and basic contact information for this vet.">
			<FieldsWrapper>
				<div className="sm:col-span-3">
					<FormField
						control={control}
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
						control={control}
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
						control={control}
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
						control={control}
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
			</FieldsWrapper>
		</SectionWrapper>
	);
}

export { VetContactInformation };