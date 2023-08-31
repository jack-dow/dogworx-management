import { type Metadata } from "next";

import { ManageBookingTypeForm } from "~/components/manage-booking-types/manage-booking-types-form";
import { PageHeader } from "~/components/page-header";

export const metadata: Metadata = {
	title: "Create New Booking Type | Dogworx Management",
};

function NewBookingTypePage() {
	return (
		<>
			<PageHeader title="Create New Booking Type" back={{ href: "/settings/booking-types" }} />

			<ManageBookingTypeForm />
		</>
	);
}

export default NewBookingTypePage;
