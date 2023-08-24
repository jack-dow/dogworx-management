import { type Metadata } from "next";

import { ManageBooking } from "~/components/manage-booking";
import { PageHeader } from "~/components/page-header";

export const metadata: Metadata = {
	title: "Create Booking | Dogworx Management",
};

function NewBookingPage() {
	return (
		<>
			<PageHeader title="Create New Booking" back={{ href: "/bookings" }} />

			<ManageBooking variant="form" />
		</>
	);
}

export default NewBookingPage;
