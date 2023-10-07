"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { hasTrueValue } from "~/lib/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormSection } from "../ui/form";
import { Switch } from "../ui/switch";
import { useToast } from "../ui/use-toast";
import { BookingTypeDeleteDialog } from "./booking-type-delete-dialog";
import { BookingTypeFields } from "./booking-types-fields";
import { useManageBookingTypeForm, type UseManageBookingTypeFormProps } from "./use-manage-booking-types-form";

function ManageBookingTypeForm({ bookingType, onSubmit, onSuccessfulSubmit }: UseManageBookingTypeFormProps) {
	const isNew = !bookingType;

	const { toast } = useToast();
	const router = useRouter();

	const { form, onSubmit: _onSubmit } = useManageBookingTypeForm({
		bookingType,
		onSubmit,
		onSuccessfulSubmit: (data) => {
			onSuccessfulSubmit?.(data);

			if (isNew) {
				router.replace(`/settings/booking-types/${data.id}`);
				return;
			}

			router.push("/settings/booking-types");
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	return (
		<>
			<ConfirmFormNavigationDialog
				open={isConfirmNavigationDialogOpen}
				onOpenChange={() => {
					setIsConfirmNavigationDialogOpen(false);
				}}
				onConfirm={() => {
					router.back();
				}}
			/>

			<Form {...form}>
				<form onSubmit={_onSubmit} className="space-y-6 lg:space-y-10">
					<FormSection
						title="Booking type Information"
						description={`
					Enter the booking type information. Remember to click ${isNew ? "create" : "update"} booking type when you're finished.
				`}
					>
						<div className="grid gap-y-4">
							<BookingTypeFields variant="form" />
						</div>
					</FormSection>

					<Separator />

					<div className="flex items-center justify-end space-x-3">
						<div className="flex items-center space-x-2">
							<FormField
								control={form.control}
								name="isDefault"
								render={({ field }) => (
									<FormItem className="flex items-center space-x-2 space-y-0">
										<FormLabel>Set to default</FormLabel>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={(checked) => {
													field.onChange(checked);
												}}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
						<Separator orientation="vertical" className="h-4" />
						{!isNew && (
							<>
								<BookingTypeDeleteDialog />
								<Separator orientation="vertical" className="h-4" />
							</>
						)}

						<Button
							type="submit"
							disabled={form.formState.isSubmitting || (!isNew && !isFormDirty)}
							onClick={() => {
								const numOfErrors = Object.keys(form.formState.errors).length;
								if (numOfErrors > 0) {
									toast({
										title: `Form submission errors`,
										description: `There ${numOfErrors === 1 ? "is" : "are"} ${numOfErrors} error${
											numOfErrors > 1 ? "s" : ""
										} with your submission. Please fix them and resubmit.`,
										variant: "destructive",
									});
								}
							}}
						>
							{form.formState.isSubmitting && <Loader size="sm" />}
							{isNew ? "Create" : "Update"} booking type
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
}

export { ManageBookingTypeForm };
