import { type Metadata } from "next";

import { ManageBookingForm } from "~/components/manage-booking/manage-booking-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export function generateMetadata({ params }: { params: { id: string } }) {
	return {
		title: `${params.id === "new" ? "Create" : "Update"} Booking | Dogworx Management`,
	} satisfies Metadata;
}

async function UpdateBookingPage({ params }: { params: { id: string } }) {
	const [booking, bookingTypes] = await Promise.all([
		params.id === "new" ? undefined : actions.app.bookings.byId(params.id),
		actions.app.bookingTypes.list(),
	]);

	return (
		<>
			<PageHeader title={`${params.id === "new" ? "Create" : "Update"} Booking`} back={{ href: "/bookings" }} />

			{booking?.data !== null ? (
				<ManageBookingForm booking={booking?.data} bookingTypes={bookingTypes.data.data} />
			) : (
				<NotFound />
			)}
		</>
	);
}

export default UpdateBookingPage;
