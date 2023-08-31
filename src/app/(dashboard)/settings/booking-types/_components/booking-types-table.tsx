"use client";

import * as React from "react";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions, type BookingTypesList } from "~/actions";
import { BOOKING_TYPES_SORTABLE_COLUMNS } from "~/actions/sortable-columns";
import { createBookingTypesTableColumns } from "./booking-types-table-columns";

function BookingTypesTable({ result }: { result: BookingTypesList }) {
	const { toast } = useToast();

	const [confirmBookingTypeDelete, setConfirmBookingTypeDelete] = React.useState<
		BookingTypesList["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				name="booking type"
				withoutTrigger
				open={!!confirmBookingTypeDelete}
				onOpenChange={() => {
					setConfirmBookingTypeDelete(null);
				}}
				onConfirm={async () => {
					if (confirmBookingTypeDelete == null) return;

					const result = await actions.app.bookingTypes.delete(confirmBookingTypeDelete.id);

					if (result.success) {
						toast({
							title: `Booking type deleted`,
							description: `Successfully deleted booking type "${confirmBookingTypeDelete.name}".`,
						});
					} else {
						toast({
							title: `Booking type deletion failed`,
							description: `There was an error deleting booking type "${confirmBookingTypeDelete.name}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				basePath="/settings"
				search={{
					onSearch: async (searchTerm) => {
						const result = await actions.app.bookingTypes.search(searchTerm);

						if (!result.success) {
							throw new Error("Failed to search booking types");
						}

						return result.data;
					},
					resultLabel: (bookingType) => `${bookingType.name}`,
				}}
				columns={createBookingTypesTableColumns((bookingType) => {
					setConfirmBookingTypeDelete(bookingType);
				})}
				sortableColumns={BOOKING_TYPES_SORTABLE_COLUMNS}
				{...result}
			/>
		</>
	);
}

export { BookingTypesTable };
