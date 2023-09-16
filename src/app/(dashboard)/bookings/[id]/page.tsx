import { type Metadata } from "next";

import { ManageBookingForm } from "~/components/manage-booking/manage-booking-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";

export function generateMetadata({ params }: { params: { id: string } }) {
	return {
		title: `${params.id === "new" ? "Create" : "Update"} Booking | Dogworx Management`,
	} satisfies Metadata;
}

async function UpdateBookingPage({ params }: { params: { id: string } }) {
	const [booking, bookingTypes] = await Promise.all([
		params.id === "new" ? undefined : server.app.bookings.byId.query({ id: params.id }),
		server.app.bookingTypes.all.query({}),
	]);

	return (
		<>
			<PageHeader title={`${params.id === "new" ? "Create" : "Update"} Booking`} back={{ href: "/bookings" }} />

			{booking?.data !== null ? (
				<ManageBookingForm booking={booking?.data} bookingTypes={bookingTypes.data} />
			) : (
				<NotFound />
			)}
		</>
	);
}

export default UpdateBookingPage;
