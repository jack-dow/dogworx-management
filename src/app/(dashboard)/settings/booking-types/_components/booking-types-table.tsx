"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/lib/trpc/client";
import { logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";
import { BOOKING_TYPES_SORTABLE_COLUMNS } from "~/server/router/sortable-columns";
import { createBookingTypesTableColumns } from "./booking-types-table-columns";

function BookingTypesTable({ initialData }: { initialData: RouterOutputs["app"]["bookingTypes"]["all"] }) {
	const { toast } = useToast();

	const searchParams = useSearchParams();

	const context = api.useContext();

	const result = api.app.bookingTypes.all.useQuery(
		{
			page: searchParams.get("page") ?? undefined,
			limit: searchParams.get("limit") ?? undefined,
			sortBy: searchParams.get("sortBy") ?? undefined,
			sortDirection: searchParams.get("sortDirection") ?? undefined,
		},
		{ initialData },
	);

	const deleteMutation = api.app.bookingTypes.delete.useMutation();
	const [confirmBookingTypeDelete, setConfirmBookingTypeDelete] = React.useState<
		RouterOutputs["app"]["bookingTypes"]["all"]["data"][number] | null
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

					try {
						await deleteMutation.mutateAsync({ id: confirmBookingTypeDelete.id });

						toast({
							title: `Booking type deleted`,
							description: `Successfully deleted booking type "${confirmBookingTypeDelete.name}".`,
						});
					} catch (error) {
						logInDevelopment(error);

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
						const result = await context.app.bookingTypes.search.fetch({ searchTerm });

						return result.data;
					},
					resultLabel: (bookingType) => `${bookingType.name}`,
				}}
				columns={createBookingTypesTableColumns((bookingType) => {
					setConfirmBookingTypeDelete(bookingType);
				})}
				sortableColumns={BOOKING_TYPES_SORTABLE_COLUMNS}
				{...result.data}
			/>
		</>
	);
}

export { BookingTypesTable };
