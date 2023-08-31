"use client";

import * as React from "react";

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
import { Button } from "../ui/button";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Form } from "../ui/form";
import { Loader } from "../ui/loader";
import { useToast } from "../ui/use-toast";
import { BookingFields } from "./booking-fields";
import { useManageBookingForm, type UseManageBookingFormProps } from "./use-manage-booking-form";

interface ManageBookingDialogProps<BookingProp extends BookingById | undefined>
	extends Omit<ManageBookingDialogFormProps<BookingProp>, "setOpen" | "onConfirmCancel" | "setIsDirty"> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
}

function ManageBookingDialog<BookingProp extends BookingById | undefined>(
	props: ManageBookingDialogProps<BookingProp>,
) {
	const isNew = !props.booking;

	const [_open, _setOpen] = React.useState(props.open);
	const [isDirty, setIsDirty] = React.useState(false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = props.open ?? _open;
	const setInternalOpen = props.setOpen ?? _setOpen;

	return (
		<>
			<ConfirmFormNavigationDialog
				open={isConfirmCloseDialogOpen}
				onOpenChange={setIsConfirmCloseDialogOpen}
				onConfirm={() => {
					setInternalOpen(false);
					setIsConfirmCloseDialogOpen(false);
				}}
			/>

			<Dialog
				open={internalOpen}
				onOpenChange={(value) => {
					if (isDirty && value === false) {
						setIsConfirmCloseDialogOpen(true);
						return;
					}

					setInternalOpen(value);
				}}
			>
				{!props.withoutTrigger && (
					<DialogTrigger asChild>{props.trigger ?? <Button>Create booking</Button>}</DialogTrigger>
				)}

				<DialogContent className="my-4 max-h-screen overflow-y-auto xl:max-w-2xl 2xl:max-w-3xl">
					<DialogHeader>
						<DialogTitle>{isNew ? "Create" : "Manage"} Booking</DialogTitle>
						<DialogDescription>
							Use this dialog to {isNew ? "create" : "update"} a booking. Click {isNew ? "create" : "update"} booking
							when you&apos;re finished.
						</DialogDescription>
					</DialogHeader>

					{/* Put actual form in a separate component inside DialogContent so that it gets unmounted when the dialog is hidden, therefore resetting the form state */}
					<ManageBookingDialogForm
						{...props}
						setOpen={setInternalOpen}
						onConfirmCancel={() => {
							setIsConfirmCloseDialogOpen(true);
						}}
						setIsDirty={setIsDirty}
						bookingTypes={props.bookingTypes}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}

interface ManageBookingDialogFormProps<BookingProp extends BookingById | undefined> extends UseManageBookingFormProps {
	setOpen: (open: boolean) => void;
	setIsDirty: (isDirty: boolean) => void;
	onConfirmCancel: () => void;
	onSuccessfulSubmit?: (booking: BookingProp extends BookingById ? BookingUpdate : BookingInsert) => void;
}

function ManageBookingDialogForm<BookingProp extends BookingById | undefined>({
	setOpen,
	setIsDirty,
	onConfirmCancel,
	onSubmit,
	onSuccessfulSubmit,
	booking,
	defaultValues,
	bookingTypes,
}: ManageBookingDialogFormProps<BookingProp>) {
	const isNew = !booking;

	const { toast } = useToast();

	const { form, onSubmit: _onSubmit } = useManageBookingForm({ booking, defaultValues, onSubmit, bookingTypes });

	React.useEffect(() => {
		setIsDirty(form.formState.isDirty);
	}, [form.formState.isDirty, setIsDirty]);

	return (
		<Form {...form}>
			<form
				className="grid gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();

					void form.handleSubmit(async (data) => {
						const result = await _onSubmit(data);

						if (result.success) {
							if (result.data && onSuccessfulSubmit) {
								onSuccessfulSubmit(result.data);
							}

							setOpen(false);
						}
					})(e);
				}}
			>
				<BookingFields variant="dialog" bookingTypes={bookingTypes} />

				<DialogFooter className="mt-2">
					<Button
						variant="outline"
						onClick={() => {
							if (form.formState.isDirty) {
								onConfirmCancel();
								return;
							}

							setOpen(false);
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
		</Form>
	);
}

export { type ManageBookingDialogProps, ManageBookingDialog };
