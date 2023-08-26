import { type Metadata } from "next";

import { ManageBookingForm } from "~/components/manage-booking/manage-booking-form";
import { PageHeader } from "~/components/page-header";

export const metadata: Metadata = {
	title: "Create Booking | Dogworx Management",
};

function NewBookingPage() {
	return (
		<>
			<PageHeader title="Create New Booking" back={{ href: "/bookings" }} />

			<ManageBookingForm />
		</>
	);
}

export default NewBookingPage;
