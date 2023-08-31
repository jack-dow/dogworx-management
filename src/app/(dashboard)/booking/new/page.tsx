import { type Metadata } from "next";

import { ManageBookingForm } from "~/components/manage-booking/manage-booking-form";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export const metadata: Metadata = {
	title: "Create Booking | Dogworx Management",
};

async function NewBookingPage() {
	const bookingTypes = await actions.app.bookingTypes.list();
	return (
		<>
			<PageHeader title="Create New Booking" back={{ href: "/bookings" }} />

			<ManageBookingForm bookingTypes={bookingTypes.data.data} />
		</>
	);
}

export default NewBookingPage;
