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
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface VerificationCodeEmailProps {
	code: string;
	requestedFromIp: string | undefined;
	requestedFromLocation: string | undefined;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const VerificationCodeEmail = ({ code, requestedFromIp, requestedFromLocation }: VerificationCodeEmailProps) => {
	const previewText = `This code will only be valid for the next 5 minutes. Do not share it with anyone.`;

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
								className="mx-auto my-0"
							/>
						</Section>
						<Heading className="mx-0 my-8 p-0 text-center text-[24px] font-medium text-black">
							Email verification code
						</Heading>

						<Section>
							<Row>
								<Column align="center">
									<code className="rounded-md border-4 bg-[#dfe1e4] px-2 py-1 font-mono text-4xl font-semibold tracking-wide text-[#3c4149]">
										{code}
									</code>
								</Column>
							</Row>
						</Section>

						<Text className="mt-8 text-[14px] leading-[24px] text-black">
							To protect your account, this code will only be valid for the next 5 minutes. Do not share it with anyone.
						</Text>
						<Hr className="mx-0 my-[20px] w-full border border-solid border-[#eaeaea]" />
						<Text className="mb-0 mt-2 text-[14px] font-medium">Didn't request this code?</Text>
						<Text className="mt-0 text-[12px] text-[#666666]">
							{requestedFromIp && requestedFromLocation && (
								<>
									This code was requested from <span className="text-black">{requestedFromIp}</span> located in{" "}
									<span className="text-black">{requestedFromLocation}</span>.{" "}
								</>
							)}
							If you were not expecting this code, you can safely ignore this email. If you are concerned about your
							account's safety, please reply to this email to get in touch with us.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
export { VerificationCodeEmail };
export default VerificationCodeEmail;
