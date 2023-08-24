import { actions } from "~/actions";
import { BookingInterceptDialog } from "../../_components/booking-intercept-dialog";

export const dynamic = "force-dynamic";

async function UpdateBookingDialog({ params: { id } }: { params: { id: string } }) {
	const result = await actions.app.bookings.byId(id);

	return <BookingInterceptDialog booking={result.data} />;
}

export default UpdateBookingDialog;
