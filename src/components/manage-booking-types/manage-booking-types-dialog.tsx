"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { useDidUpdate } from "~/hooks/use-did-update";
import { Button } from "../ui/button";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Form } from "../ui/form";
import { Loader } from "../ui/loader";
import { Separator } from "../ui/separator";
import { useToast } from "../ui/use-toast";
import { BookingTypeDeleteDialog } from "./booking-type-delete-dialog";
import { BookingTypeFields } from "./booking-types-fields";
import { useManageBookingTypeForm, type UseManageBookingTypeFormProps } from "./use-manage-booking-types-form";

interface ManageBookingTypeDialogProps
	extends Omit<ManageBookingTypeDialogFormProps, "setOpen" | "setIsDirty" | "isNew"> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
}

function ManageBookingTypeDialog(props: ManageBookingTypeDialogProps) {
	// This is in state so that we can use the booking type prop as the open state as well when using the sheet without having a flash between update/new state on sheet closing
	const [isNew, setIsNew] = React.useState(!props.bookingType);

	const pathname = usePathname();

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

	useDidUpdate(() => {
		setInternalOpen(false);
	}, [pathname]);

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

				<DialogContent>
					<DialogHeader>
						<DialogTitle>{isNew ? "Create" : "Manage"} Booking type</DialogTitle>
						<DialogDescription>
							Use this dialog to {isNew ? "create" : "update"} a booking type. Click {isNew ? "create" : "update"}{" "}
							booking type when you&apos;re finished.
						</DialogDescription>
					</DialogHeader>

					{/* Put actual form in a separate component inside DialogContent so that it gets unmounted when the dialog is hidden, therefore resetting the form state */}
					<ManageBookingTypeDialogForm {...props} setOpen={setInternalOpen} setIsDirty={setIsDirty} isNew={isNew} />
				</DialogContent>
			</Dialog>
		</>
	);
}

interface ManageBookingTypeDialogFormProps extends UseManageBookingTypeFormProps {
	setOpen: (open: boolean) => void;
	setIsDirty: (isDirty: boolean) => void;
	isNew: boolean;
}

function ManageBookingTypeDialogForm({
	setOpen,
	setIsDirty,
	onSubmit,
	onSuccessfulSubmit,
	bookingType,
	defaultValues,
	isNew,
}: ManageBookingTypeDialogFormProps) {
	const { toast } = useToast();

	const { form, onSubmit: _onSubmit } = useManageBookingTypeForm({
		bookingType,
		defaultValues,
		onSubmit,
		onSuccessfulSubmit: (data) => {
			onSuccessfulSubmit?.(data);

			setOpen(false);
		},
	});

	React.useEffect(() => {
		setIsDirty(form.formState.isDirty);
	}, [form.formState.isDirty, setIsDirty]);

	return (
		<Form {...form}>
			<form className="grid gap-4" onSubmit={_onSubmit}>
				<BookingTypeFields variant="dialog" />

				<DialogFooter className="mt-2 items-center">
					{!isNew && (
						<>
							<BookingTypeDeleteDialog
								onSuccessfulDelete={() => {
									setOpen(false);
								}}
							/>
							<Separator orientation="vertical" className="h-4" />
						</>
					)}
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
