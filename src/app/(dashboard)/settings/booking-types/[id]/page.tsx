import { type Metadata } from "next";

import { ManageBookingTypeForm } from "~/components/manage-booking-types/manage-booking-types-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export function generateMetadata({ params }: { params: { id: string } }) {
	return {
		title: `${params.id === "new" ? "Create" : "Update"} Booking Type | Dogworx Management`,
	} satisfies Metadata;
}

async function UpdateVetClinicPage({ params }: { params: { id: string } }) {
	const bookingTypes = params.id === "new" ? undefined : await actions.app.bookingTypes.byId(params.id);

	return (
		<>
			<PageHeader
				title={`${params.id === "new" ? "Create" : "Update"} Booking Type${
					bookingTypes?.data?.name ? ` "${bookingTypes?.data.name}" ` : ""
				}`}
				back={{ href: "/settings/booking-types" }}
			/>

			{bookingTypes?.data !== null ? <ManageBookingTypeForm bookingType={bookingTypes?.data} /> : <NotFound />}
		</>
	);
}
export default UpdateVetClinicPage;
