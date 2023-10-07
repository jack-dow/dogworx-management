import { env } from "process";
import { NextResponse, type NextRequest } from "next/server";
import BookingCancellationEmail from "emails/booking-cancellation-email";
import { Resend } from "resend";
import { z } from "zod";

import { type APIResponse } from "~/app/api/_utils";
import { drizzle } from "~/db/drizzle";
import { secondsToHumanReadable } from "~/lib/utils";
import { verifyAPISession } from "../../_utils";

const SendBookingCancellationBodySchema = z.object({
	bookingId: z.string(),
});

type SendBookingCancellationPOSTResponse = APIResponse<undefined, "BookingNotFound" | "InvalidBooking" | "PastBooking">;

const resend = new Resend(env.RESEND_API_KEY);

async function POST(request: NextRequest): Promise<NextResponse<SendBookingCancellationPOSTResponse>> {
	const body = (await request.json()) as unknown;

	const validation = SendBookingCancellationBodySchema.safeParse(body);

	if (!validation.success) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "InvalidBody",
					message: validation.error.issues,
				},
			},
			{ status: 400 },
		);
	}

	try {
		const verifiedSession = await verifyAPISession();

		if (!verifiedSession.success) {
			return NextResponse.json(
				{
					success: false,
					error: verifiedSession.error,
				},
				{
					status: verifiedSession.status,
				},
			);
		}

		const { bookingId } = validation.data;

		const booking = await drizzle.query.bookings.findFirst({
			columns: {
				duration: true,
				date: true,
			},
			where: (bookings, { eq, and }) =>
				and(eq(bookings.id, bookingId), eq(bookings.organizationId, verifiedSession.data.user.organizationId)),
			with: {
				bookingType: {
					columns: {
						name: true,
					},
				},
				assignedTo: {
					columns: {
						emailAddress: true,
						givenName: true,
						familyName: true,
					},
					with: {
						organization: {
							columns: {
								name: true,
								streetAddress: true,
								city: true,
								state: true,
								postalCode: true,
								emailAddress: true,
								timezone: true,
							},
						},
					},
				},
				dog: {
					columns: {
						id: true,
						givenName: true,
						familyName: true,
					},
					with: {
						dogToClientRelationships: {
							columns: {
								id: true,
								relationship: true,
							},
							where: (dogToClientRelationships, { eq }) => eq(dogToClientRelationships.relationship, "owner"),
							with: {
								client: {
									columns: {
										id: true,
										emailAddress: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!booking) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "BookingNotFound",
						message: "No booking was found with that ID.",
					},
				},
				{ status: 404 },
			);
		}

		if (!booking.dog) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "InvalidBooking",
						message: "This booking does not have a dog associated with it.",
					},
				},
				{ status: 404 },
			);
		}

		if (new Date() > booking.date) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "PastBooking",
						message: "This booking has already passed.",
					},
				},
				{ status: 400 },
			);
		}

		await resend.emails.send({
			from: "Dogworx Management <bookings@dogworx.com.au>",
			to: [
				// ...booking.dog.dogToClientRelationships.map((relationship) => relationship.client.emailAddress),
				"bookings@dogworx.com.au",
			],
			subject: `Cancelled: ${secondsToHumanReadable(booking.duration, { nonPlural: true })} ${
				booking.bookingType ? booking.bookingType.name.toLowerCase() : "booking"
			} for ${booking.dog.givenName}`,
			react: (
				<BookingCancellationEmail
					bookingType={booking.bookingType ?? { name: "booking" }}
					booking={booking}
					assignedTo={booking.assignedTo}
					dog={booking.dog}
					organization={booking.assignedTo.organization}
				/>
			),
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "UnknownError",
					message: "An unknown error occurred. Please try again.",
				},
			},
			{
				status: 500,
			},
		);
	}
}

export { POST, type SendBookingCancellationPOSTResponse };
