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
import { api } from "~/lib/trpc/client";
import { logInDevelopment } from "~/lib/utils";
import { Button } from "../ui/button";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Form } from "../ui/form";
import { Loader } from "../ui/loader";
import { Separator } from "../ui/separator";
import { useToast } from "../ui/use-toast";
import { BookingDeleteDialog } from "./booking-delete-dialog";
import { BookingFields } from "./booking-fields";
import { ConfirmOverlappingBookingDialog } from "./confirm-overlapping-bookng-dialog";
import { useManageBookingForm, type UseManageBookingFormProps } from "./use-manage-booking-form";

interface ManageBookingDialogProps extends Omit<ManageBookingDialogFormProps, "setOpen" | "setIsDirty" | "isNew"> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
}

function ManageBookingDialog(props: ManageBookingDialogProps) {
	// This is in state so that we can use the booking prop as the open state as well when using the sheet without having a flash between update/new state on sheet closing
	const [isNew, setIsNew] = React.useState(!props.booking);

	const pathname = usePathname();

	const [_open, _setOpen] = React.useState(props.open);
	const [isDirty, setIsDirty] = React.useState(false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = props.open ?? _open;
	const setInternalOpen = props.setOpen ?? _setOpen;

	React.useEffect(() => {
		if (internalOpen) {
			setIsNew(!props.booking);
			return;
		}
	}, [internalOpen, props.booking]);

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
					<DialogTrigger asChild>{props.trigger ?? <Button>Create booking</Button>}</DialogTrigger>
				)}

				<DialogContent className="xl:max-w-2xl 2xl:max-w-3xl">
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
						setIsDirty={setIsDirty}
						bookingTypes={props.bookingTypes}
						isNew={isNew}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}

interface ManageBookingDialogFormProps extends UseManageBookingFormProps {
	setOpen: (open: boolean) => void;
	setIsDirty: (isDirty: boolean) => void;
	isNew: boolean;
	disableDogSearch?: boolean;
}

function ManageBookingDialogForm({
	setOpen,
	setIsDirty,
	onSubmit,
	onSuccessfulSubmit,
	booking,
	defaultValues,
	bookingTypes,
	isNew,
	disableDogSearch,
}: ManageBookingDialogFormProps) {
	const { toast } = useToast();
	const [isConfirmOverlappingBookingDialogOpen, setIsConfirmOverlappingBookingDialogOpen] = React.useState(false);
	const [isCheckingForOverlappingBookings, setIsCheckingForOverlappingBookings] = React.useState(false);

	const { form, onSubmit: _onSubmit } = useManageBookingForm({
		booking,
		defaultValues,
		onSubmit,
		bookingTypes,
		onSuccessfulSubmit: (data) => {
			onSuccessfulSubmit?.(data);

			setOpen(false);
		},
	});

	React.useEffect(() => {
		setIsDirty(form.formState.isDirty);
	}, [form.formState.isDirty, setIsDirty]);

	const context = api.useContext();

	return (
		<>
			<ConfirmOverlappingBookingDialog
				open={isConfirmOverlappingBookingDialogOpen}
				onOpenChange={setIsConfirmOverlappingBookingDialogOpen}
				assignedTo={form.getValues("assignedTo")}
				onConfirm={() => {
					_onSubmit();
				}}
			/>

			<Form {...form}>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();

						setIsCheckingForOverlappingBookings(true);

						context.app.bookings.checkForOverlaps
							.fetch({
								assignedToId: form.getValues("assignedToId"),
								date: form.getValues("date"),
								duration: form.getValues("duration"),
							})
							.then((res) => {
								if (res.data.length > 0) {
									setIsConfirmOverlappingBookingDialogOpen(true);
								} else {
									_onSubmit(e);
								}
							})
							.catch((err) => {
								logInDevelopment(err);

								_onSubmit(e);
							})
							.finally(() => {
								setIsCheckingForOverlappingBookings(false);
							});
					}}
					className="flex flex-col gap-4"
				>
					<BookingFields variant="dialog" disableDogSearch={disableDogSearch} bookingTypes={bookingTypes} />

					<DialogFooter className="mt-2 items-center">
						{!isNew && (
							<>
								<BookingDeleteDialog
									onSuccessfulDelete={() => {
										setOpen(false);
									}}
								/>
								<Separator orientation="vertical" className="h-4" />
							</>
						)}

						<Button
							type="submit"
							disabled={
								form.formState.isSubmitting || (!isNew && !form.formState.isDirty) || isCheckingForOverlappingBookings
							}
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
							{(form.formState.isSubmitting || isCheckingForOverlappingBookings) && <Loader size="sm" />}
							{!isNew ? "Update booking" : "Create booking"}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</>
	);
}

export { type ManageBookingDialogProps, ManageBookingDialog };
