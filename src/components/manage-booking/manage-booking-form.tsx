"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { api } from "~/lib/trpc/client";
import { hasTrueValue, logInDevelopment } from "~/lib/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormSection } from "../ui/form";
import { Switch } from "../ui/switch";
import { useToast } from "../ui/use-toast";
import { BookingDeleteDialog } from "./booking-delete-dialog";
import { BookingFields } from "./booking-fields";
import { ConfirmOverlappingBookingDialog } from "./confirm-overlapping-bookng-dialog";
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
	const [isConfirmOverlappingBookingDialogOpen, setIsConfirmOverlappingBookingDialogOpen] = React.useState(false);
	const [isCheckingForOverlappingBookings, setIsCheckingForOverlappingBookings] = React.useState(false);

	const context = api.useContext();

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
								bookingId: form.getValues("id"),
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
					className="space-y-6 lg:space-y-10"
				>
					<FormSection
						title="Booking Information"
						description={`
					Enter the booking information. Remember to click ${isNew ? "create" : "update"} booking when you're finished.
				`}
					>
						<div className="flex flex-col gap-y-4">
							<BookingFields variant="form" bookingTypes={bookingTypes} />
						</div>
					</FormSection>

					<Separator />

					<div className="flex justify-end space-x-4">
						{!isNew && (
							<>
								<FormField
									control={form.control}
									name="sendEmailUpdates"
									render={({ field }) => (
										<FormItem className="flex items-center space-x-2 space-y-0">
											<FormLabel>Send email updates</FormLabel>
											<FormControl>
												<Switch
													checked={field.value}
													onCheckedChange={(checked) => {
														form.setValue("sendEmailUpdates", checked, { shouldDirty: false });
													}}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
								<Separator orientation="vertical" className="h-4" />
							</>
						)}

						{isNew ? (
							<FormField
								control={form.control}
								name="sendConfirmationEmail"
								render={({ field }) => (
									<FormItem className="flex items-center space-x-2 space-y-0">
										<FormLabel>Send confirmation email</FormLabel>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={(checked) => {
													form.setValue("sendConfirmationEmail", checked, { shouldDirty: false });
												}}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						) : (
							<BookingDeleteDialog />
						)}

						<Separator orientation="vertical" className="h-4" />

						<Button
							type="submit"
							disabled={form.formState.isSubmitting || (!isNew && !isFormDirty) || isCheckingForOverlappingBookings}
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
							{isNew ? "Create" : "Update"} booking
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
}

export { ManageBookingForm };
