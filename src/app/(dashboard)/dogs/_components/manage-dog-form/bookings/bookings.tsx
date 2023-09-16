"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { ManageBookingDialog } from "~/components/manage-booking/manage-booking-dialog";
import { Button } from "~/components/ui/button";
import { FormSection } from "~/components/ui/form";
import { PlusIcon } from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/components/ui/use-toast";
import { useDayjs } from "~/hooks/use-dayjs";
import { api } from "~/lib/trpc/client";
import { type RouterOutputs } from "~/server";
import { type ManageDogFormSchema } from "../manage-dog-form";
import { BookingsList } from "./bookings-list";

function Bookings({
	isNew,
	bookingTypes,
}: {
	isNew: boolean;
	bookingTypes: RouterOutputs["app"]["bookingTypes"]["all"]["data"];
}) {
	const { dayjs } = useDayjs();
	const { toast } = useToast();

	const context = api.useContext();

	const form = useFormContext<ManageDogFormSchema>();

	const bookings = useFieldArray({
		control: form.control,
		name: "bookings",
		keyName: "rhf-id",
	});

	const [currentTab, setCurrentTab] = React.useState<"past" | "future">("past");

	const [hasFetchedInitialFutureSessions, setHasFetchedInitialFutureSessions] = React.useState(false);
	const [isLoadingInitialFutureSessions, setIsLoadingInitialFutureSessions] = React.useState(false);

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
								context.app.bookings.search
									.fetch({
										dogId: form.getValues("id"),
										after: dayjs.tz().startOf("day").toDate(),
										sortDirection: "asc",
									})
									.then(({ data }) => {
										bookings.append(data);

										setHasFetchedInitialFutureSessions(true);
										setCurrentTab(value as typeof currentTab);
									})
									.catch(() => {
										toast({
											title: "Failed to fetch future bookings",
											description:
												"Something went wrong whilst trying to fetch this dog's future bookings Please try again.",
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
								disableDogSearch={isNew}
								onSubmit={isNew ? async () => {} : undefined}
								onSuccessfulSubmit={(booking) => {
									bookings.append(booking);
								}}
							/>
						</div>
						<TabsContent value="past">
							<BookingsList isNew={isNew} tab="past" bookingTypes={bookingTypes} />
						</TabsContent>

						<TabsContent value="future">
							<BookingsList isNew={isNew} tab="future" bookingTypes={bookingTypes} />
						</TabsContent>
					</Tabs>
				</div>
			</FormSection>
		</>
	);
}

export { Bookings };
