"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { type BookingById, type BookingInsert, type BookingUpdate } from "~/actions";
import { generateId } from "~/utils";
import { Button } from "../ui/button";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Loader } from "../ui/loader";
import { useToast } from "../ui/use-toast";
import { BookingFields } from "./booking-fields";
import { type ManageBookingFormSchemaType } from "./manage-booking";

type DefaultValues = Partial<ManageBookingFormSchemaType>;

type ManageBookingDialogProps<BookingProp extends BookingById | undefined> = {
	dog?: BookingById["dog"];
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
	onSubmit: (
		data: ManageBookingFormSchemaType,
	) => Promise<{ success: boolean; data: BookingInsert | BookingUpdate | null | undefined }>;
	onSuccessfulSubmit?: (booking: BookingProp extends BookingById ? BookingUpdate : BookingInsert) => void;
	booking?: BookingProp;
	defaultValues?: DefaultValues;
};

function ManageBookingDialog<BookingProp extends BookingById | undefined>({
	open,
	setOpen,
	withoutTrigger,
	trigger,
	onSubmit,
	onSuccessfulSubmit,
	booking,
	dog,
}: ManageBookingDialogProps<BookingProp>) {
	const isNew = !booking;

	const { toast } = useToast();

	const [_open, _setOpen] = React.useState(open);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const form = useFormContext<ManageBookingFormSchemaType>();

	function handleClose() {
		setInternalOpen(false);
		setTimeout(() => {
			form.reset();
			form.setValue("id", generateId());
		}, 205);
	}

	return (
		<>
			<ConfirmFormNavigationDialog
				open={isConfirmCloseDialogOpen}
				onOpenChange={setIsConfirmCloseDialogOpen}
				onConfirm={() => {
					handleClose();
					setIsConfirmCloseDialogOpen(false);
				}}
			/>

			<Dialog
				open={internalOpen}
				onOpenChange={(value) => {
					// Form state check **MUST** be first otherwise a bug occurs where it is always false on the first close
					if (form.formState.isDirty && value === false) {
						setIsConfirmCloseDialogOpen(true);
						return;
					}

					if (value === false) {
						handleClose();
						return;
					}

					setInternalOpen(value);
				}}
			>
				{!withoutTrigger && <DialogTrigger asChild>{trigger ?? <Button>Create booking</Button>}</DialogTrigger>}

				<DialogContent className="xl:max-w-2xl 2xl:max-w-3xl">
					<DialogHeader>
						<DialogTitle>Manage Booking</DialogTitle>
						<DialogDescription>
							Use this dialog to {isNew ? "create" : "update"} a booking. Click {isNew ? "create" : "update"} booking
							when you&apos;re finished.
						</DialogDescription>
					</DialogHeader>

					<form
						className="grid gap-4"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();

							void form.handleSubmit(async (data) => {
								const result = await onSubmit(data);

								if (result.success) {
									if (result.data && onSuccessfulSubmit) {
										onSuccessfulSubmit(result.data);
									}

									setInternalOpen(false);

									setTimeout(() => {
										form.reset();
										form.setValue("id", generateId());
									}, 205);
								}
							})(e);
						}}
					>
						<BookingFields variant="dialog" dog={dog} />

						<DialogFooter className="mt-2">
							<Button
								variant="outline"
								onClick={() => {
									if (form.formState.isDirty) {
										setIsConfirmCloseDialogOpen(true);
										return;
									}

									handleClose();
								}}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}
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
								{!isNew ? "Update booking" : "Create booking"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}

export { type ManageBookingDialogProps, ManageBookingDialog };
