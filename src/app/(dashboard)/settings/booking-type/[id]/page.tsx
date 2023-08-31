import { type Metadata } from "next";

import { ManageBookingTypeForm } from "~/components/manage-booking-types/manage-booking-types-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";

export const metadata: Metadata = {
	title: "Update Booking Type | Dogworx Management",
};

async function UpdateVetClinicPage({ params }: { params: { id: string } }) {
	const result = await actions.app.bookingTypes.byId(params.id);

	return (
		<>
			<PageHeader
				title={`Update Booking Type${result.data?.name ? ` "${result.data.name}" ` : ""}`}
				back={{ href: "/settings/booking-types" }}
			/>

			{result.data ? <ManageBookingTypeForm bookingType={result.data} /> : <NotFound />}
		</>
	);
}
export default UpdateVetClinicPage;
