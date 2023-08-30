"use client";

import * as React from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useFormContext } from "react-hook-form";

import { ManageBookingDialog } from "~/components/manage-booking/manage-booking-dialog";
import { Button } from "~/components/ui/button";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { ChevronLeftIcon, ChevronRightIcon } from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { actions, type DogById } from "~/actions";
import { useUser } from "~/app/(dashboard)/providers";
import { type ManageDogFormSchema } from "../manage-dog-form";
import { Booking } from "./booking";

dayjs.extend(customParseFormat);

function sortBookingsAscending(a: DogById["bookings"][number], b: DogById["bookings"][number]) {
	if (a.date > b.date) {
		return 1;
	}
	if (a.date < b.date) {
		return -1;
	}

	if (a.duration > b.duration) {
		return 1;
	}

	if (a.duration < b.duration) {
		return -1;
	}

	// If dates are the same, compare ids in ascending order (like the db query)
	return a.id.localeCompare(b.id);
}

function sortBookingsDescending(a: DogById["bookings"][number], b: DogById["bookings"][number]) {
	if (a.date > b.date) {
		return -1;
	}
	if (a.date < b.date) {
		return 1;
	}

	if (a.duration > b.duration) {
		return -1;
	}

	if (a.duration < b.duration) {
		return 1;
	}

	// If dates are the same, compare ids in ascending order (like the db query)
	return a.id.localeCompare(b.id);
}

function BookingsList({
	isNew,
	bookings,
	setBookings,
	onAddOrUpdateBooking,
	tab,
}: {
	isNew: boolean;
	bookings: DogById["bookings"];
	setBookings: React.Dispatch<React.SetStateAction<DogById["bookings"]>>;
	onAddOrUpdateBooking: (booking: DogById["bookings"][number]) => void;
	tab: "past" | "future";
}) {
	const user = useUser();
	const { toast } = useToast();
	const form = useFormContext<ManageDogFormSchema>();

	const [page, setPage] = React.useState(1);
	const [loadedPages, setLoadedPages] = React.useState(1);
	const [isLoading, setIsLoading] = React.useState(false);
	const [hasMore, setHasMore] = React.useState(bookings.length > 5);

	const [confirmBookingDelete, setConfirmBookingDelete] = React.useState<string | null>(null);

	const [isManageBookingDialogOpen, setIsManageBookingDialogOpen] = React.useState(false);
	const [editingBooking, setEditingBooking] = React.useState<DogById["bookings"][number] | null>(null);
	const [copiedBooking, setCopiedBooking] = React.useState<DogById["bookings"][number] | null>(null);

	let visibleSessions: typeof bookings = [];

	if (tab === "past") {
		visibleSessions = [...bookings].sort(sortBookingsDescending).slice((page - 1) * 5, page * 5);
	} else {
		visibleSessions = [...bookings].sort(sortBookingsAscending).slice((page - 1) * 5, page * 5);
	}

	React.useEffect(() => {
		// If new booking has been added, ensure loaded pages is correct
		if (bookings.length > loadedPages * 5) {
			setHasMore(true);
			setLoadedPages(loadedPages + 1);
		}
	}, [bookings, loadedPages]);

	return (
		<>
			<DestructiveActionDialog
				name="booking"
				withoutTrigger
				open={!!confirmBookingDelete}
				onOpenChange={() => setConfirmBookingDelete(null)}
				onConfirm={async () => {
					if (confirmBookingDelete) {
						if (isNew) {
							const bookingActions = form.getValues("actions.bookings");

							delete bookingActions[confirmBookingDelete];

							form.setValue("actions.bookings", bookingActions);

							setBookings(bookings.filter((f) => f.id !== confirmBookingDelete));

							if (visibleSessions.length - 1 === 0) {
								setPage(page - 1);
								setLoadedPages(loadedPages - 1);
							}
							return;
						}

						await actions.app.bookings
							.delete({ id: confirmBookingDelete, dogId: form.getValues("id") })
							.then((result) => {
								if (!result.success) {
									throw new Error("Failed to delete booking");
								}

								setBookings(bookings.filter((f) => f.id !== confirmBookingDelete));

								if (bookings.length - 1 < result.data.count) {
									setHasMore(true);
								}

								if (bookings.length - 1 === result.data.count) {
									setHasMore(false);
								}

								if (visibleSessions.length - 1 === 0) {
									setPage(page - 1);
									setLoadedPages(loadedPages - 1);
								}

								toast({
									title: "Session deleted",
									description: "This booking has been successfully deleted.",
								});
							})
							.catch(() => {
								toast({
									title: "Session deletion failed",
									description: "There was an error deleting this booking. Please try again.",
									variant: "destructive",
								});
							});
					}
				}}
			/>

			<ManageBookingDialog
				open={isManageBookingDialogOpen}
				setOpen={(value) => {
					if (value === false) {
						setIsManageBookingDialogOpen(false);
						setTimeout(() => {
							setEditingBooking(null);
							setCopiedBooking(null);
						}, 205);
					}
				}}
				withoutTrigger
				booking={
					editingBooking
						? {
								...editingBooking,
								dog: {
									id: form.getValues("id"),
									givenName: form.getValues("givenName") ?? "Unnamed new dog",
									familyName: form.getValues("familyName") ?? "",
									color: form.getValues("color"),
									breed: form.getValues("breed"),
								},
						  }
						: undefined
				}
				defaultValues={
					copiedBooking
						? {
								...copiedBooking,
								dog: {
									id: form.getValues("id"),
									givenName: form.getValues("givenName") ?? "Unnamed new dog",
									familyName: form.getValues("familyName") ?? "",
								},
						  }
						: undefined
				}
				onSuccessfulSubmit={onAddOrUpdateBooking}
				onSubmit={
					isNew
						? // eslint-disable-next-line @typescript-eslint/require-await
						  async (booking) => {
								form.setValue(
									"actions.bookings",
									{
										...form.getValues("actions.bookings"),
										[booking.id]: {
											type: "INSERT",
											payload: booking,
										},
									},
									{ shouldDirty: true },
								);

								toast({
									title: "Booking updated",
									description: `Successfully updated booking to dog's ${
										dayjs(booking.date).isBefore(dayjs()) ? "past" : "future"
									} bookings.`,
								});

								return {
									success: true,
									data: {
										...booking,
										createdAt: new Date(),
										updatedAt: new Date(),
										organizationId: user.organizationId,
										assignedToId: booking.assignedToId ?? user.id,
										assignedTo: booking.assignedTo ?? user,
									},
								};
						  }
						: undefined
				}
			/>

			<ul role="list">
				{visibleSessions.map((booking, index) => {
					return (
						<Booking
							key={booking.id}
							booking={booking}
							isLast={index === 4 || index === visibleSessions.length - 1}
							onEditClick={() => {
								setEditingBooking(booking);
								setIsManageBookingDialogOpen(true);
							}}
							onCopy={() => {
								setCopiedBooking(booking);
								setIsManageBookingDialogOpen(true);
							}}
							onDelete={() => {
								setConfirmBookingDelete(booking.id);
							}}
						/>
					);
				})}
			</ul>

			{visibleSessions.length > 0 ? (
				<div className="flex items-center justify-center space-x-2">
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						disabled={page === 1}
						onClick={() => {
							setPage(page - 1);
							setHasMore(true);
						}}
					>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeftIcon className="h-4 w-4" />
					</Button>

					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						disabled={isNew ? bookings.length <= page * 5 : !hasMore || isLoading}
						onClick={() => {
							if (page !== loadedPages || isNew) {
								if (page + 1 === loadedPages && bookings.length <= loadedPages * 5) {
									setHasMore(false);
								}
								setPage(page + 1);
								return;
							}

							if (bookings.length > loadedPages * 5) {
								setIsLoading(true);

								let cursor: (typeof bookings)[number] | null = null;

								if (tab === "past") {
									cursor = [...bookings]
										.sort(sortBookingsDescending)
										.slice((page - 1) * 5, page * 5)
										.pop()!;
								} else {
									cursor = [...bookings]
										.sort(sortBookingsAscending)
										.slice((page - 1) * 5, page * 5)
										.pop()!;
								}

								actions.app.bookings
									.search({
										dogId: form.getValues("id"),
										cursor,
										after: tab === "past" ? undefined : dayjs().startOf("day").toDate(),
										sortDirection: tab === "past" ? "desc" : "asc",
									})
									.then((result) => {
										if (!result.success) {
											throw new Error("Failed to load bookings");
										}

										setBookings((prev) => [...prev, ...result.data]);
										setPage(page + 1);
										setLoadedPages(loadedPages + 1);
										setHasMore(result.data.length === 5);
									})
									.catch(() => {
										toast({
											title: "Failed to load bookings",
											description: "There was an error loading more bookings. Please try again.",
											variant: "destructive",
										});
									})
									.finally(() => {
										setIsLoading(false);
									});
								return;
							}
						}}
					>
						<span className="sr-only">Go to next page</span>
						{isLoading ? (
							<Loader size="sm" variant="black" className="mr-0" />
						) : (
							<ChevronRightIcon className="h-4 w-4" />
						)}
					</Button>
				</div>
			) : (
				<div className="flex items-center justify-center space-x-2">
					<p className="text-sm italic text-muted-foreground">No {tab} bookings.</p>
				</div>
			)}
		</>
	);
}

export { BookingsList };
