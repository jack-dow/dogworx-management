"use client";

import * as React from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useFormContext } from "react-hook-form";

import { ManageBookingDialog } from "~/components/manage-booking/manage-booking-dialog";
import { Button } from "~/components/ui/button";
import { FormSection } from "~/components/ui/form";
import { PlusIcon } from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/components/ui/use-toast";
import { actions, type DogById } from "~/actions";
import { useUser } from "~/app/(dashboard)/providers";
import { type ManageDogFormSchema } from "../manage-dog-form";
import { BookingsList } from "./bookings-list";

dayjs.extend(customParseFormat);

function Bookings({ isNew, bookings }: { isNew: boolean; bookings?: DogById["bookings"] }) {
	const user = useUser();
	const { toast } = useToast();

	const form = useFormContext<ManageDogFormSchema>();
	const [currentTab, setCurrentTab] = React.useState<"past" | "future">("past");

	const [pastBookings, setPastBookings] = React.useState<Array<DogById["bookings"][number]>>(bookings ?? []);
	const [futureBookings, setFutureBookings] = React.useState<Array<DogById["bookings"][number]>>([]);

	const [hasFetchedInitialFutureSessions, setHasFetchedInitialFutureSessions] = React.useState(false);
	const [isLoadingInitialFutureSessions, setIsLoadingInitialFutureSessions] = React.useState(false);

	function handleAddOrUpdateBooking(booking: DogById["bookings"][number]) {
		if (dayjs(booking.date).isBefore(dayjs())) {
			setPastBookings((prev) => [...prev.filter((f) => f.id !== booking.id), booking]);
			return;
		}

		setFutureBookings((prev) => [...prev.filter((f) => f.id !== booking.id), booking]);
	}

	return (
		<>
			<FormSection
				title="Booking History"
				description="You can add past bookings that weren't recorded on the day, or add future bookings to keep track of upcoming visits."
			>
				<div className="flex flex-col gap-y-8">
					<Tabs
						className="flex w-full flex-col gap-y-6"
						value={currentTab}
						onValueChange={(value) => {
							if (!isNew && value === "future" && !hasFetchedInitialFutureSessions) {
								setIsLoadingInitialFutureSessions(true);
								actions.app.bookings
									.search({ dogId: form.getValues("id"), after: dayjs().startOf("day").toDate(), sortDirection: "asc" })
									.then((bookings) => {
										if (bookings.success) {
											setFutureBookings(bookings.data);
											setHasFetchedInitialFutureSessions(true);
											setCurrentTab(value as typeof currentTab);
											return;
										}
										throw new Error("Failed to fetch future bookings");
									})
									.catch(() => {
										toast({
											title: "Something went wrong",
											description: "Failed to fetch future bookings. Please try again.",
											variant: "destructive",
										});
									})
									.finally(() => {
										setCurrentTab(value);
										setIsLoadingInitialFutureSessions(false);
									});
							} else {
								setCurrentTab(value as typeof currentTab);
							}
						}}
					>
						<div className="flex w-full gap-x-4">
							<TabsList className="flex-1">
								<TabsTrigger value="past" className="flex-1">
									Past Sessions
								</TabsTrigger>
								<TabsTrigger value="future" className="flex-1">
									<span className="relative flex items-center">
										<Loader
											size="sm"
											variant="black"
											className={isLoadingInitialFutureSessions ? "absolute -left-5 mr-0" : "hidden"}
										/>
										Future Bookings
									</span>
								</TabsTrigger>
							</TabsList>

							<ManageBookingDialog
								dog={{
									id: form.getValues("id"),
									givenName: form.getValues("givenName") ?? "Unnamed new dog",
									familyName: form.getValues("familyName") ?? "",
									color: form.getValues("color"),
									breed: form.getValues("breed"),
								}}
								trigger={
									<Button variant="outline" size="icon">
										<span className="sr-only">Create booking</span>
										<PlusIcon className="h-5 w-5" />
									</Button>
								}
								onSubmit={async (booking) => {
									if (isNew) {
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
											title: "Booking added",
											description: `Successfully added booking to dog's ${
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

									try {
										const result = await actions.app.bookings.insert(booking);

										if (!result.success) {
											throw new Error("Failed to create booking");
										}

										toast({
											title: "Booking created",
											description: "Booking has been successfully created.",
										});

										return { success: true, data: result.data };
									} catch {
										toast({
											title: "Booking creation failed",
											description: "There was an error adding this booking. Please try again.",
											variant: "destructive",
										});
										return { success: false, data: null };
									}
								}}
								onSuccessfulSubmit={(booking) => {
									if (dayjs(booking.date).isBefore(dayjs())) {
										setPastBookings([...pastBookings, booking]);
									} else {
										setFutureBookings([...futureBookings, booking]);
									}
								}}
							/>
						</div>
						<TabsContent value="past">
							<BookingsList
								isNew={isNew}
								bookings={pastBookings}
								setBookings={setPastBookings}
								tab="past"
								onAddOrUpdateBooking={handleAddOrUpdateBooking}
							/>
						</TabsContent>

						<TabsContent value="future">
							<BookingsList
								isNew={isNew}
								bookings={futureBookings ?? []}
								setBookings={setFutureBookings}
								tab="future"
								onAddOrUpdateBooking={handleAddOrUpdateBooking}
							/>
						</TabsContent>
					</Tabs>
				</div>
			</FormSection>
		</>
	);
}

export { Bookings };
