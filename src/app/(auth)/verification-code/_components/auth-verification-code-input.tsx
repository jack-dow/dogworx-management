"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { VerificationCodeInput } from "~/components/ui/verification-code-input";
import { type SendMagicLinkPOSTResponse } from "~/app/api/auth/sign-in/magic-link/send/route";
import { type SignInWithVerificationCodeGETResponse } from "~/app/api/auth/sign-in/verification-code/route";

function AuthVerificationCodeInput() {
	const { toast } = useToast();

	const searchParams = useSearchParams();
	const router = useRouter();
	const [isLoading, setIsLoading] = React.useState(true);
	const [resendCodeCountdown, setResendCodeCountdown] = React.useState(60);

	React.useEffect(() => {
		let timer: NodeJS.Timeout;

		if (resendCodeCountdown > 0) {
			timer = setInterval(() => {
				setResendCodeCountdown((prevCountdown) => prevCountdown - 1);
			}, 1000);
		}

		return () => {
			clearInterval(timer);
		};
	}, [resendCodeCountdown]);

	const handleSendEmail = React.useCallback(() => {
		setIsLoading(true);
		async function sendEmail() {
			const response = await fetch("/api/auth/sign-in/magic-link/send", {
				method: "POST",
				body: JSON.stringify({ emailAddress: searchParams.get("emailAddress") }),
			});
			const body = (await response.json()) as SendMagicLinkPOSTResponse;
			return body;
		}

		sendEmail()
			.then(() => {
				setResendCodeCountdown(60);
			})
			.catch(() => {
				toast({
					title: "Failed to send verification code",
					description:
						"An unknown error occurred while trying to send a new verification code to your email address. Please try again.",
					variant: "destructive",
				});
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [searchParams, toast, setResendCodeCountdown]);

	return (
		<>
			<div className="flex justify-center">
				<VerificationCodeInput
					onSubmit={async (verificationCode) => {
						const response = await fetch(`/api/auth/sign-in/verification-code?code=${verificationCode}`);

						const body = (await response.json()) as SignInWithVerificationCodeGETResponse;

						if (!body.success && body.error.code === "InvalidCode") {
							toast({
								title: "Invalid verification code",
								description:
									typeof body.error.message === "string"
										? body.error.message
										: "The verification code you provided is invalid or expired. Please request a new one and try again.",
								variant: "destructive",
							});
							throw new Error("Invalid verification code");
						}

						if (!response.ok) {
							toast({
								title: `Failed to verify your email address`,
								description: `An unknown error occurred while trying to verify your email address. Please try again.`,
								variant: "destructive",
							});
							throw new Error("Failed to verify email address");
						}

						router.push("/");
					}}
				/>
			</div>
			<div>
				<Button
					type="button"
					variant="link"
					className="-ml-4 -mt-2"
					disabled={resendCodeCountdown > 0 || isLoading}
					onClick={() => {
						handleSendEmail();
						toast({
							title: "Verification code sent",
							description: "We've sent a new verification code to your email address.",
						});
					}}
				>
					{"Didn't receive an email? Click here to resend. "}
					{resendCodeCountdown > 0 ? `(${resendCodeCountdown})` : ""}
				</Button>
			</div>
		</>
	);
}

export { AuthVerificationCodeInput };
