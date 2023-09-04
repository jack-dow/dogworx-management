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
import { type BookingTypeById, type BookingTypeInsert, type BookingTypeUpdate } from "~/actions";
import { Button } from "../ui/button";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Form } from "../ui/form";
import { Loader } from "../ui/loader";
import { useToast } from "../ui/use-toast";
import { BookingTypeDeleteDialog } from "./booking-types-delete-dialog";
import { BookingTypeFields } from "./booking-types-fields";
import { useManageBookingTypeForm, type UseManageBookingTypeFormProps } from "./use-manage-booking-types-form";

interface ManageBookingTypeDialogProps<BookingTypeProp extends BookingTypeById | undefined>
	extends Omit<
		ManageBookingTypeDialogFormProps<BookingTypeProp>,
		"setOpen" | "onConfirmCancel" | "setIsDirty" | "isNew"
	> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
}

function ManageBookingTypeDialog<BookingTypeProp extends BookingTypeById | undefined>(
	props: ManageBookingTypeDialogProps<BookingTypeProp>,
) {
	// This is in state so that we can use the booking type prop as the open state as well when using the sheet without having a flash between update/new state on sheet closing
	const [isNew, setIsNew] = React.useState(!props.bookingType);

	const [_open, _setOpen] = React.useState(props.open);
	const [isDirty, setIsDirty] = React.useState(false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = props.open ?? _open;
	const setInternalOpen = props.setOpen ?? _setOpen;

	React.useEffect(() => {
		if (internalOpen) {
			setIsNew(!props.bookingType);
			return;
		}
	}, [internalOpen, props.bookingType]);

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
					<DialogTrigger asChild>{props.trigger ?? <Button>Create booking type</Button>}</DialogTrigger>
				)}

				<DialogContent className="max-h-screen overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{isNew ? "Create" : "Manage"} Booking type</DialogTitle>
						<DialogDescription>
							Use this dialog to {isNew ? "create" : "update"} a booking type. Click {isNew ? "create" : "update"}{" "}
							booking type when you&apos;re finished.
						</DialogDescription>
					</DialogHeader>

					{/* Put actual form in a separate component inside DialogContent so that it gets unmounted when the dialog is hidden, therefore resetting the form state */}
					<ManageBookingTypeDialogForm
						{...props}
						setOpen={setInternalOpen}
						onConfirmCancel={() => {
							setIsConfirmCloseDialogOpen(true);
						}}
						setIsDirty={setIsDirty}
						isNew={isNew}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}

interface ManageBookingTypeDialogFormProps<BookingTypeProp extends BookingTypeById | undefined>
	extends UseManageBookingTypeFormProps {
	setOpen: (open: boolean) => void;
	setIsDirty: (isDirty: boolean) => void;
	onConfirmCancel: () => void;
	isNew: boolean;
	onSuccessfulSubmit?: (
		bookingType: BookingTypeProp extends BookingTypeById ? BookingTypeUpdate : BookingTypeInsert,
	) => void;
}

function ManageBookingTypeDialogForm<BookingTypeProp extends BookingTypeById | undefined>({
	setOpen,
	setIsDirty,
	onConfirmCancel,
	onSubmit,
	onSuccessfulSubmit,
	bookingType,
	defaultValues,
	isNew,
}: ManageBookingTypeDialogFormProps<BookingTypeProp>) {
	const { toast } = useToast();

	const { form, onSubmit: _onSubmit } = useManageBookingTypeForm({ bookingType, defaultValues, onSubmit });

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
				<BookingTypeFields variant="dialog" />

				<DialogFooter className="mt-2">
					{!isNew && (
						<BookingTypeDeleteDialog
							onSuccessfulDelete={() => {
								setOpen(false);
							}}
						/>
					)}
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
						{!isNew ? "Update booking type" : "Create booking type"}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}

export { type ManageBookingTypeDialogProps, ManageBookingTypeDialog };
