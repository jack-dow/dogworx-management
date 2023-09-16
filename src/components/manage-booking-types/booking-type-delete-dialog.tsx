"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { api } from "~/lib/trpc/client";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageBookingTypeFormSchema } from "./use-manage-booking-types-form";

function BookingTypeDeleteDialog({ onSuccessfulDelete }: { onSuccessfulDelete?: () => void }) {
	const router = useRouter();
	const pathname = usePathname();

	const form = useFormContext<ManageBookingTypeFormSchema>();
	const { toast } = useToast();

	const deleteMutation = api.app.bookingTypes.delete.useMutation();

	return (
		<DestructiveActionDialog
			name="booking type"
			onConfirm={async () => {
				try {
					await deleteMutation.mutateAsync({
						id: form.getValues("id"),
					});
					toast({
						title: `Booking type deleted`,
						description: `Successfully deleted booking type "${form.getValues("name")}".`,
					});

					if (pathname.startsWith("/bookings/")) {
						router.push("/bookings");
						return;
					}

					onSuccessfulDelete?.();
				} catch (error) {
					toast({
						title: `Booking type deletion failed`,
						description: `There was an error deleting booking type "${form.getValues("name")}". Please try again.`,
						variant: "destructive",
					});
				}
			}}
		/>
	);
}

export { BookingTypeDeleteDialog };
