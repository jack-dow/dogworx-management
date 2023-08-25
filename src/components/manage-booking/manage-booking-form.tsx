"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { type BookingById } from "~/actions";
import { generateId, hasTrueValue } from "~/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { FormSection } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { BookingDeleteDialog } from "./booking-delete-dialog";
import { BookingFields } from "./booking-fields";
import { type ManageBookingFormSchemaType } from "./manage-booking";

type ManageBookingFormProps = {
	dog?: BookingById["dog"];
	onSubmit: (data: ManageBookingFormSchemaType) => Promise<{ success: boolean }>;
	booking?: BookingById;
	open?: undefined;
	setOpen?: undefined;
	onSuccessfulSubmit?: undefined;
	withoutTrigger?: undefined;
	trigger?: undefined;
	defaultValues?: undefined;
};

function ManageBookingForm({ booking, onSubmit, dog }: ManageBookingFormProps) {
	const isNew = !booking;

	const { toast } = useToast();
	const router = useRouter();

	const form = useFormContext<ManageBookingFormSchemaType>();
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	async function handleSubmit(data: ManageBookingFormSchemaType) {
		const result = await onSubmit(data);

		if (result.success) {
			if (isNew) {
				router.replace(`/booking/${data.id}`);
			} else {
				router.push("/bookings");
			}

			form.setValue("id", generateId());
		}
	}

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

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					void form.handleSubmit(handleSubmit)(e);
				}}
				className="space-y-6 lg:space-y-10"
			>
				<FormSection
					title="Booking Information"
					description={`
					Enter the booking information. Remember to click ${isNew ? "create" : "update"} booking when you're finished.
				`}
				>
					<div className="grid gap-y-4">
						<BookingFields variant="form" dog={dog} />
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
							} else {
								router.back();
							}
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
		</>
	);
}

export { type ManageBookingFormProps, ManageBookingForm };
