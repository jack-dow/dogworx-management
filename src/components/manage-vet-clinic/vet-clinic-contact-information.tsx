"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";

import {
	FormControl,
	FormField,
	FormGroup,
	FormItem,
	FormLabel,
	FormMessage,
	FormSection,
	FormSheetGroup,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
import { type ManageVetClinicFormSchema } from "./use-manage-vet-clinic-form";

function VetClinicContactInformation({ variant }: { variant: "sheet" | "form" }) {
	const form = useFormContext<ManageVetClinicFormSchema>();

	const SectionWrapper = variant === "sheet" ? FormSheetGroup : FormSection;
	const FieldsWrapper = variant === "sheet" ? React.Fragment : FormGroup;

	return (
		<SectionWrapper
			title="Contact Information"
			description="This information will be used throughout the app to identify this vet clinic. Add any other relevant information about this vet clinic in the notes section."
		>
			<FieldsWrapper>
				<div className="sm:col-span-6">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
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
export { VetClinicContactInformation };
