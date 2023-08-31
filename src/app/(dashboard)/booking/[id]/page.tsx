import { type Metadata } from "next";

import { ManageBookingForm } from "~/components/manage-booking/manage-booking-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export const metadata: Metadata = {
	title: "Update Booking | Dogworx Management",
};

async function UpdateBookingPage({ params }: { params: { id: string } }) {
	const [booking, bookingTypes] = await Promise.all([
		actions.app.bookings.byId(params.id),
		actions.app.bookingTypes.list(),
	]);

	return (
		<>
			<PageHeader title="Update Booking" back={{ href: "/bookings" }} />

			{booking.data ? <ManageBookingForm booking={booking.data} bookingTypes={bookingTypes.data.data} /> : <NotFound />}
		</>
	);
}

export default UpdateBookingPage;
