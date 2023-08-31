"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { actions } from "~/actions";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageBookingFormSchema } from "./use-manage-booking-form";

function BookingDeleteDialog({ onSuccessfulDelete }: { onSuccessfulDelete?: () => void }) {
	const router = useRouter();
	const pathname = usePathname();

	const form = useFormContext<ManageBookingFormSchema>();
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
						title: `Booking deleted`,
						description: `Successfully deleted booking.`,
					});

					if (pathname.startsWith("/booking/")) {
						router.push("/bookings");
						return;
					}

					onSuccessfulDelete?.();
				} else {
					toast({
						title: `Booking deletion failed`,
						description: `There was an error deleting this booking. Please try again.`,
						variant: "destructive",
					});
				}
			}}
		/>
	);
}

export { BookingDeleteDialog };
