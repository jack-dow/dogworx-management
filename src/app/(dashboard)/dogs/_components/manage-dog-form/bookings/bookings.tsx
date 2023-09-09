"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";

import { ManageBookingDialog } from "~/components/manage-booking/manage-booking-dialog";
import { Button } from "~/components/ui/button";
import { FormSection } from "~/components/ui/form";
import { PlusIcon } from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/components/ui/use-toast";
import { actions, type BookingTypesList, type DogById } from "~/actions";
import { useUser } from "~/app/providers";
import { useDayjs } from "~/hooks/use-dayjs";
import { type ManageDogFormSchema } from "../manage-dog-form";
import { BookingsList } from "./bookings-list";

function Bookings({
	isNew,
	bookings,
	bookingTypes,
}: {
	isNew: boolean;
	bookings?: DogById["bookings"];
	bookingTypes: BookingTypesList["data"];
}) {
	const { dayjs } = useDayjs();
	const user = useUser();
	const { toast } = useToast();

	const form = useFormContext<ManageDogFormSchema>();
	const [currentTab, setCurrentTab] = React.useState<"past" | "future">("past");

	const [pastBookings, setPastBookings] = React.useState<Array<DogById["bookings"][number]>>(bookings ?? []);
	const [futureBookings, setFutureBookings] = React.useState<Array<DogById["bookings"][number]>>([]);

	const [hasFetchedInitialFutureSessions, setHasFetchedInitialFutureSessions] = React.useState(false);
	const [isLoadingInitialFutureSessions, setIsLoadingInitialFutureSessions] = React.useState(false);

	function handleAddOrUpdateBooking(booking: DogById["bookings"][number]) {
		if (dayjs.tz(booking.date).isBefore(dayjs.tz())) {
			// Remove booking if dog has been changed
			if (booking.dogId !== form.getValues("id")) {
				setPastBookings((prev) => [...prev.filter((f) => f.id !== booking.id)]);
				return;
			}

			setPastBookings((prev) => [...prev.filter((f) => f.id !== booking.id), booking]);
			return;
		}

		// Remove booking if dog has been changed
		if (booking.dogId !== form.getValues("id")) {
			setFutureBookings((prev) => [...prev.filter((f) => f.id !== booking.id)]);
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
									.search({
										dogId: form.getValues("id"),
										after: dayjs.tz().startOf("day").toDate(),
										sortDirection: "asc",
									})
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
								bookingTypes={bookingTypes}
								trigger={
									<Button variant="outline" size="icon">
										<span className="sr-only">Create booking</span>
										<PlusIcon className="h-5 w-5" />
									</Button>
								}
								dog={
									isNew
										? {
												id: form.getValues("id"),
												givenName: form.getValues("givenName"),
												familyName: form.getValues("familyName") ?? "",
												breed: form.getValues("breed"),
												color: form.getValues("color"),
										  }
										: undefined
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
												dayjs.tz(booking.date).isBefore(dayjs.tz()) ? "past" : "future"
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
									if (dayjs.tz(booking.date).isBefore(dayjs.tz())) {
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
								bookingTypes={bookingTypes}
							/>
						</TabsContent>

						<TabsContent value="future">
							<BookingsList
								isNew={isNew}
								bookings={futureBookings ?? []}
								setBookings={setFutureBookings}
								tab="future"
								onAddOrUpdateBooking={handleAddOrUpdateBooking}
								bookingTypes={bookingTypes}
							/>
						</TabsContent>
					</Tabs>
				</div>
			</FormSection>
		</>
	);
}

export { Bookings };
