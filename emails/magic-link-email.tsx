import * as React from "react";
import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
	code: string;
	token: string;
	requestedFromIp: string | undefined;
	requestedFromLocation: string | undefined;
}

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

const MagicLinkEmail = ({ code = "123456", token, requestedFromIp, requestedFromLocation }: MagicLinkEmailProps) => {
	const previewText = `This link and code will only be valid for the next 5 minutes. Do not share it with anyone.`;

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<Body className="m-auto bg-white font-sans">
					<Container className="mx-auto my-[40px] w-[465px] rounded p-[20px]">
						<Section className="mt-[32px]">
							<Img
								src={`${baseUrl}/static/dogworx-logo-gradient.png`}
								width="60"
								height="50"
								alt="Dogworx Hydrotherapy"
								className="my-0"
							/>
						</Section>
						<Heading className="mx-0 my-8 p-0  text-[24px] font-medium text-black">
							Your Dogworx Management Login
						</Heading>

						<Section className="my-[24px] text-center">
							<Row>
								<Column align="left">
									<Button
										pX={16}
										pY={17.6}
										className="rounded-md bg-[#0f172a] text-center text-[14px] font-medium text-[#f8fafc] no-underline"
										href={baseUrl + "/api/auth/sign-in/magic-link?token=" + token}
									>
										Login to Dogworx Management
									</Button>
								</Column>
							</Row>
						</Section>

						<Text className="mt-8 text-[14px] leading-[24px] text-black">
							To protect your account, this link and code will only be valid for the next 5 minutes. Do not share it
							with anyone.
						</Text>
						<Section className="my-[24px]">
							<Row>
								<Column align="left">
									<code className="rounded-md border-4 bg-[#dfe1e4] px-2 py-1 font-mono text-[24px] font-semibold tracking-wide text-[#3c4149]">
										{code}
									</code>
								</Column>
							</Row>
						</Section>
						<Hr className="mx-0 my-[20px] w-full border border-solid border-[#eaeaea]" />
						<Text className="mb-0 mt-2 text-[14px] font-medium">Didn't request this login?</Text>
						<Text className="mt-0 text-[12px] text-[#666666]">
							{requestedFromIp && requestedFromLocation && (
								<>
									This login was requested from <span className="text-black">{requestedFromIp}</span> located in{" "}
									<span className="text-black">{requestedFromLocation}</span>.{" "}
								</>
							)}
							If you were not expecting this request, you can safely ignore this email. If you are concerned about your
							account's safety, please reply to this email to get in touch with us.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
export { MagicLinkEmail };
export default MagicLinkEmail;
