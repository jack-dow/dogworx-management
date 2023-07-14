import { type Control } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { RichTextEditor } from "../ui/rich-text-editor";
import { type ManageVetClinicSheetFormSchema } from "./manage-vet-clinic-sheet";

function VetClinicContactInformation({ control }: { control: Control<ManageVetClinicSheetFormSchema> }) {
	return (
		<div>
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Contact Information</h2>
				<p className="text-sm leading-6 text-muted-foreground">
					The name and basic contact information for this vet clinic.
				</p>
			</div>
			<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-6">
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
						name="phoneNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Phone Number</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} />
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
									<RichTextEditor content={field.value ?? ""} onValueChange={field.onChange} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
		</div>
	);
}

export { VetClinicContactInformation };
