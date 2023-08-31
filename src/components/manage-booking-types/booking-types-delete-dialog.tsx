"use client";

import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { actions } from "~/actions";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageBookingTypeFormSchema } from "./use-manage-booking-types-form";

function BookingTypeDeleteDialog() {
	const form = useFormContext<ManageBookingTypeFormSchema>();
	const router = useRouter();
	const { toast } = useToast();

	return (
		<DestructiveActionDialog
			name="booking"
			onConfirm={async () => {
				const result = await actions.app.bookings.delete({
					id: form.getValues("id"),
				});

				if (result.success) {
					toast({
						title: `Booking type deleted`,
						description: `Successfully deleted booking.`,
					});
					router.push("/vets");
				} else {
					toast({
						title: `Booking type deletion failed`,
						description: `There was an error deleting booking "${form.getValues("name")}". Please try again.`,
						variant: "destructive",
					});
				}
			}}
		/>
	);
}

export { BookingTypeDeleteDialog };
