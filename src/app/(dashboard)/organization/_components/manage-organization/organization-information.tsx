"use client";

import * as React from "react";
import { type Control } from "react-hook-form";

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
import { type ManageOrganizationFormSchema } from "./manage-organization";

function OrganizationInformation({
	control,
	variant,
}: {
	control: Control<ManageOrganizationFormSchema>;
	variant: "sheet" | "form";
}) {
	const SectionWrapper = variant === "sheet" ? FormSheetGroup : FormSection;
	const FieldsWrapper = variant === "sheet" ? React.Fragment : FormGroup;

	return (
		<SectionWrapper title="Organization Information" description="The information for this organization.">
			<FieldsWrapper>
				<div className="sm:col-span-6">
					<FormField
						control={control}
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

				<div className="sm:col-span-6">
					<FormField
						control={control}
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

export { OrganizationInformation };
