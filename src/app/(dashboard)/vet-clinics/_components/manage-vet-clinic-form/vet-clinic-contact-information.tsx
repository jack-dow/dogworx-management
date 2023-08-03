"use client";

import { useFormContext, type Control } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
import { type ManageVetClinicFormSchema } from "./manage-vet-clinic-form";

function VetClinicContactInformation({ control }: { control: Control<ManageVetClinicFormSchema> }) {
	const form = useFormContext<ManageVetClinicFormSchema>();

	return (
		<div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Contact Information</h2>
				<p className="text-sm leading-6 text-muted-foreground">
					The name and basic contact information for this vet clinic.
				</p>
			</div>

			<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 xl:col-span-2">
				<div className="sm:p-8">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-6 sm:gap-y-6">
						<div className="sm:col-span-6">
							<FormField
								control={control}
								name="name"
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
					</div>
				</div>
			</div>
		</div>
	);
}
export { VetClinicContactInformation };
