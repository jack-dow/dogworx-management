import { NextResponse, type NextRequest } from "next/server";
import BookingReminderEmail from "emails/booking-reminder-email";
import { Resend } from "resend";

import { type APIResponse } from "~/app/api/_utils";
import { drizzle } from "~/db/drizzle";
import { env } from "~/env.mjs";
import { logInDevelopment, secondsToHumanReadable } from "~/lib/utils";

type SendBookingRemindersPOSTResponse = APIResponse<undefined>;

const resend = new Resend(env.RESEND_API_KEY);

async function GET(request: NextRequest): Promise<NextResponse<SendBookingRemindersPOSTResponse>> {
	const authorization = request.headers.get("authorization");

	if (authorization !== env.CRON_SECRET) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "NotAuthorized",
					message: "Invalid secret",
				},
			},
			{ status: 401 },
		);
	}

	try {
		console.log(
			"2 day",
			new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000),
			new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
		);
		console.log(
			"7 day",
			new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000),
			new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
		);

		const bookings = await drizzle.query.bookings.findMany({
			columns: {
				duration: true,
				date: true,
			},
			// Get all bookings that are in either 2 days time or 7 days time
			where: (bookings, { or, between, and, eq, ne }) =>
				and(
					eq(bookings.organizationId, env.NEXT_PUBLIC_ADMIN_ORG_ID),
					ne(bookings.dogId, ""),
					or(
						// 2 days time
						between(
							bookings.date,
							new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000),
							new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
						),

						// 7 days time
						between(
							bookings.date,
							new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000),
							new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
						),
					),
				),
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

		await Promise.all(
			bookings.map(async (booking) => {
				if (!booking.dog) {
					return;
				}

				await resend.emails.send({
					from: "Dogworx Management <bookings@dogworx.com.au>",
					to: [
						// ...booking.dog.dogToClientRelationships.map((relationship) => relationship.client.emailAddress),
						"bookings@dogworx.com.au",
					],
					subject: `${secondsToHumanReadable(booking.duration, { nonPlural: true })} ${
						booking.bookingType ? booking.bookingType.name.toLowerCase() : "booking"
					} for ${booking.dog.givenName}`,
					react: (
						<BookingReminderEmail
							bookingType={booking.bookingType ?? { name: "booking" }}
							booking={booking}
							assignedTo={booking.assignedTo}
							dog={booking.dog}
							organization={booking.assignedTo.organization}
						/>
					),
				});
			}),
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		logInDevelopment(error);
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

export { GET, type SendBookingRemindersPOSTResponse };
