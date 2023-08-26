import { type Metadata } from "next";

import { ManageBookingForm } from "~/components/manage-booking/manage-booking-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export const metadata: Metadata = {
	title: "Update Booking | Dogworx Management",
};

async function UpdateBookingPage({ params }: { params: { id: string } }) {
	const result = await actions.app.bookings.byId(params.id);

	return (
		<>
			<PageHeader title="Update Booking" back={{ href: "/bookings" }} />

			{result.data ? <ManageBookingForm booking={result.data} /> : <NotFound />}
		</>
	);
}

export default UpdateBookingPage;
