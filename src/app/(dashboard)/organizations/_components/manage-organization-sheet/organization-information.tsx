import { type Control } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
import { type ManageOrganizationSheetFormSchema } from "./manage-organization-sheet";

function OrganizationInformation({ control }: { control: Control<ManageOrganizationSheetFormSchema> }) {
	return (
		<div>
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Organization Information</h2>
				<p className="text-sm leading-6 text-muted-foreground">The information for this organization.</p>
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

export { OrganizationInformation };
