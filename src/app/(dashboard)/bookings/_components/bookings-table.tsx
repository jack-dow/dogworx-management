"use client";

import * as React from "react";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions, type BookingsList } from "~/actions";
import { DOG_SESSIONS_SORTABLE_COLUMNS } from "~/actions/sortable-columns";
import { createBookingsTableColumns } from "./bookings-table-columns";

function BookingsTable({ result }: { result: BookingsList }) {
	const { toast } = useToast();

	const [confirmBookingDelete, setConfirmBookingDelete] = React.useState<BookingsList["data"][number] | null>(null);

	return (
		<>
			<DestructiveActionDialog
				name="booking"
				withoutTrigger
				open={!!confirmBookingDelete}
				onOpenChange={() => {
					setConfirmBookingDelete(null);
				}}
				onConfirm={async () => {
					if (confirmBookingDelete == null) return;

					const result = await actions.app.bookings.delete({
						id: confirmBookingDelete.id,
						dogId: confirmBookingDelete.dogId,
					});

					if (result.success) {
						toast({
							title: `Booking deleted`,
							description: `Successfully deleted booking`,
						});
					} else {
						toast({
							title: `Booking deletion failed`,
							description: `There was an error deleting the booking. Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				columns={createBookingsTableColumns((booking) => {
					setConfirmBookingDelete(booking);
				})}
				sortableColumns={DOG_SESSIONS_SORTABLE_COLUMNS}
				{...result}
			/>
		</>
	);
}

export { BookingsTable };
