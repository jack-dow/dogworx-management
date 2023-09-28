import * as React from "react";
import {
	Body,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import { type InferSelectModel } from "drizzle-orm";

import { type organizations } from "~/db/schema/auth";
import { type RouterOutputs } from "~/server";

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

const defaultBookingType = {
	id: "123",
	name: "Initial Consult",
	duration: 1800,
	color: "#00000",
	isDefault: false,
	showDetailsInCalendar: false,
} satisfies RouterOutputs["app"]["bookingTypes"]["all"]["data"][number];

const defaultBooking = {
	id: "456",
	bookingTypeId: "123",
	assignedTo: {
		id: "789",
		emailAddress: "john@example.com",
		givenName: "John",
		familyName: "Doe",
		organizationId: "131415",
		organizationRole: "admin",
		profileImageUrl: null,
	},
	assignedToId: "789",
	createdAt: new Date(),
	updatedAt: new Date(),
	date: new Date(),
	duration: 1800,
	details: "",
	dog: {
		id: "101112",
		givenName: "Spot",
		familyName: "Smith",
		breed: "Dalmation",
		color: "White",
	},
	dogId: "101112",
	organizationId: "131415",
} satisfies RouterOutputs["app"]["bookings"]["byId"]["data"];

const defaultOrganization = {
	streetAddress: "Shop 6/659 Reserve Rd",
	name: "Dogworx Hydrotherapy",
	city: "Upper Coomera",
	state: "QLD",
	postalCode: "4209",
	emailAddress: "sandy@dogworx.com.au",
} satisfies Pick<
	InferSelectModel<typeof organizations>,
	"name" | "streetAddress" | "city" | "state" | "postalCode" | "emailAddress"
>;

interface BookingConfirmationEmailProps {
	bookingType: RouterOutputs["app"]["bookingTypes"]["all"]["data"][number];
	booking: RouterOutputs["app"]["bookings"]["byId"]["data"];
	organization: Pick<
		InferSelectModel<typeof organizations>,
		"name" | "streetAddress" | "city" | "state" | "postalCode" | "emailAddress"
	>;
	timezone: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const BookingConfirmationEmail = ({
	bookingType = defaultBookingType,
	booking = defaultBooking,
	organization = defaultOrganization,
	timezone = "Australia/Brisbane",
}: BookingConfirmationEmailProps) => {
	const previewText = `This code will only be valid for the next 5 minutes. Do not share it with anyone.`;

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
							A new booking has been scheduled
						</Heading>

						<Hr className="mx-0 my-[20px] w-full border border-solid border-[#eaeaea]" />

						<Section>
							<Text className="mb-2 text-base font-medium leading-none">What</Text>
							<Text className="mb-10 mt-2">
								{secondsToHumanReadable(bookingType.duration)} {bookingType.name}
							</Text>

							<Text className="mb-2 text-base font-medium leading-none">When</Text>
							<Text className="mb-10 mt-2">
								{booking.date.toLocaleDateString("en-US", {
									weekday: "long",
									year: "numeric",
									month: "long",
									day: "numeric",
								})}{" "}
								| {booking.date.toLocaleTimeString("en-US", { timeStyle: "short" })} -{" "}
								{new Date(booking.date.setSeconds(booking.date.getSeconds() + bookingType.duration)).toLocaleTimeString(
									"en-US",
									{ timeStyle: "short" },
								)}{" "}
								({timezone})
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
export { BookingConfirmationEmail };
export default BookingConfirmationEmail;
