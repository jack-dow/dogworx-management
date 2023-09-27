import { type Metadata } from "next";

import { ManageBookingTypeForm } from "~/components/manage-booking-types/manage-booking-types-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";

export function generateMetadata({ params }: { params: { id: string } }) {
	return {
		title: `${params.id === "new" ? "Create" : "Update"} Booking Type | Dogworx Management`,
	} satisfies Metadata;
}

async function UpdateVetClinicPage({ params }: { params: { id: string } }) {
	const bookingTypes = params.id === "new" ? undefined : await server.app.bookingTypes.byId.query({ id: params.id });

	return (
		<>
			<PageHeader
				title={`${params.id === "new" ? "Create" : "Update"} Booking Type`}
				back={{ href: "/settings/booking-types" }}
			/>

			{bookingTypes?.data !== null ? <ManageBookingTypeForm bookingType={bookingTypes?.data} /> : <NotFound />}
		</>
	);
}
export default UpdateVetClinicPage;
