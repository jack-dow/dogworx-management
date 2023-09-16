"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { hasTrueValue } from "~/lib/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Form, FormSection } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { BookingDeleteDialog } from "./booking-delete-dialog";
import { BookingFields } from "./booking-fields";
import { useManageBookingForm, type UseManageBookingFormProps } from "./use-manage-booking-form";

function ManageBookingForm({ booking, onSubmit, bookingTypes, onSuccessfulSubmit }: UseManageBookingFormProps) {
	const isNew = !booking;

	const { toast } = useToast();
	const router = useRouter();

	const { form, onSubmit: _onSubmit } = useManageBookingForm({
		booking,
		onSubmit,
		bookingTypes,
		onSuccessfulSubmit: (data) => {
			onSuccessfulSubmit?.(data);

			if (isNew) {
				router.replace(`/bookings/${data.id}`);
				return;
			}

			router.push("/bookings");
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
						title="Booking Information"
						description={`
					Enter the booking information. Remember to click ${isNew ? "create" : "update"} booking when you're finished.
				`}
					>
						<div className="flex flex-col gap-y-4">
							<BookingFields variant="form" booking={booking} bookingTypes={bookingTypes} />
						</div>
					</FormSection>

					<Separator />

					<div className="flex justify-end space-x-4">
						{!isNew && <BookingDeleteDialog />}
						<Button
							type="button"
							onClick={() => {
								if (isFormDirty) {
									setIsConfirmNavigationDialogOpen(true);
									return;
								}

								router.back();
							}}
							variant="outline"
						>
							Back
						</Button>
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
							{isNew ? "Create" : "Update"} booking
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
}

export { ManageBookingForm };
