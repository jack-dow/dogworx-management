import * as React from "react";
import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import { type InferSelectModel } from "drizzle-orm";

import { type bookings, type bookingTypes, type dogs } from "~/db/schema/app";
import { type organizations, type users } from "~/db/schema/auth";

function secondsToHumanReadable(seconds: number): string {
	if (seconds === 86400) {
		return "1 day";
	}
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	const formattedTime = [];
	if (hours > 0) {
		formattedTime.push(`${hours} hour`);
	}
	if (minutes > 0) {
		formattedTime.push(`${minutes} minute`);
	}
	if (remainingSeconds > 0 || formattedTime.length === 0) {
		formattedTime.push(`${remainingSeconds} second`);
	}

	return formattedTime.join(", ");
}

type Booking = Pick<InferSelectModel<typeof bookings>, "duration" | "date">;
type BookingType = Pick<InferSelectModel<typeof bookingTypes>, "name">;
type AssignedTo = Pick<InferSelectModel<typeof users>, "givenName" | "familyName" | "emailAddress">;
type Dog = Pick<InferSelectModel<typeof dogs>, "givenName" | "familyName">;
type Organization = Pick<
	InferSelectModel<typeof organizations>,
	"name" | "streetAddress" | "city" | "state" | "postalCode" | "emailAddress" | "timezone"
>;

interface BookingConfirmationEmailProps {
	booking: Booking;
	bookingType: BookingType;
	assignedTo: AssignedTo;
	dog: Dog;
	organization: Organization;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const BookingReminderEmail = ({
	bookingType,
	booking,
	assignedTo,
	dog,
	organization,
}: BookingConfirmationEmailProps) => {
	const previewText = `Reminder for your upcoming booking at ${organization.name} on ${booking.date.toLocaleDateString(
		"en-US",
		{ weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: organization.timezone },
	)} at ${booking.date.toLocaleTimeString("en-US", { timeStyle: "short", timeZone: organization.timezone })}
		 `;

	const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
		`${organization.streetAddress}, ${organization.city}, ${organization.state} ${organization.postalCode}`,
	)}`;

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<Body className="m-auto bg-white font-sans">
					<Container className="mx-auto my-[40px] max-w-[600px] rounded p-[20px]">
						<Section className="mt-[32px]">
							<Img
								src={`${baseUrl}/static/dogworx-logo-gradient.png`}
								width="60"
								height="50"
								alt="Dogworx Hydrotherapy"
								className="mx-auto my-0"
							/>
						</Section>
						<Heading className="mx-0 my-8 p-0 text-center text-[24px] font-medium text-black">
							Reminder for your upcoming booking
						</Heading>

						<Hr className="mx-0 my-[20px] w-full border border-solid border-[#eaeaea]" />

						<Section>
							<Text className="mb-2 text-base font-medium leading-none">What</Text>
							<Text className="mb-8 mt-2">
								{secondsToHumanReadable(booking.duration)} {bookingType.name}
							</Text>

							<Text className="mb-2 text-base font-medium leading-none">When</Text>
							<Text className="mb-8 mt-2">
								{booking.date.toLocaleDateString("en-US", {
									weekday: "long",
									year: "numeric",
									month: "long",
									day: "numeric",
									timeZone: organization.timezone,
								})}{" "}
								| {booking.date.toLocaleTimeString("en-US", { timeStyle: "short", timeZone: organization.timezone })} -{" "}
								{new Date(booking.date.setSeconds(booking.date.getSeconds() + booking.duration)).toLocaleTimeString(
									"en-US",
									{ timeStyle: "short", timeZone: organization.timezone },
								)}{" "}
								({organization.timezone})
							</Text>

							<Text className="mb-2 text-base font-medium leading-none">Who</Text>
							<Text className="mb-0">
								{assignedTo.givenName} {assignedTo.familyName} - Clinician{" "}
								<Link href={`mailto:${assignedTo.emailAddress}`} className="text-blue-600 underline">
									{assignedTo.emailAddress}
								</Link>
							</Text>
							<Text className="mb-8 mt-1">
								{dog.givenName} {dog.familyName} - Dog
							</Text>

							<Text className="mb-2 text-base font-medium leading-none">Where</Text>
							<Text className="mt-2 flex items-center">
								{organization.name} |{" "}
								<Link href={mapsLink} className="pl-1 text-blue-600 underline">
									{organization.streetAddress}, {organization.city}, {organization.state} {organization.postalCode}
								</Link>
							</Text>
						</Section>

						<Hr className="mx-0 my-[20px] w-full border border-solid border-[#eaeaea]" />
						<Text className="mb-0 mt-2 text-[14px] font-medium">Need to make a change?</Text>
						<Text className="mt-0 text-[12px] text-[#666666]">
							To make changes to this booking, please contact us at{" "}
							<Link href={`mailto:${organization.emailAddress}`} className="text-blue-600 underline">
								{organization.emailAddress}
							</Link>
							.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
export { BookingReminderEmail };
export default BookingReminderEmail;
