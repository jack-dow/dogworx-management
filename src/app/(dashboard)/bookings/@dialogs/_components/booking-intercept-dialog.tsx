"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ManageBooking } from "~/components/manage-booking";
import { useToast } from "~/components/ui/use-toast";
import { type BookingById } from "~/actions";

function BookingInterceptDialog({ booking }: { booking?: BookingById | null }) {
	const router = useRouter();
	const [open, setOpen] = React.useState(true);
	const { toast } = useToast();

	if (booking === null) {
		toast({
			title: `Booking not found`,
			description: `No booking was found with the ID provided. Please try again.`,
			variant: "destructive",
		});
	}

	return (
		<ManageBooking
			variant="dialog"
			open={open}
			withoutTrigger
			setOpen={(value) => {
				// Wait for closing animation to finish before navigating back
				if (value === false) {
					setOpen(false);
					setTimeout(() => {
						setOpen(true);
						router.back();
					}, 205);
				}
			}}
			booking={booking ?? undefined}
		/>
	);
}

export { BookingInterceptDialog };
