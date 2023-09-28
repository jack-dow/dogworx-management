"use client";

import * as React from "react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { TRPCError } from "@trpc/server";

import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { VerificationCodeInput } from "~/components/ui/verification-code-input";
import { api } from "~/lib/trpc/client";
import { getBaseUrl } from "~/lib/utils";

function AuthVerificationCodeInput() {
	const { toast } = useToast();

	const searchParams = useSearchParams();
	const emailAddress = searchParams.get("emailAddress") ?? "";
	const router = useRouter();
	const [isLoading, setIsLoading] = React.useState(true);
	const [resendCodeCountdown, setResendCodeCountdown] = React.useState(60);

	const sendMagicLinkMutation = api.auth.signIn.magicLink.send.useMutation();
	const validateVerificationCodeMutation = api.auth.signIn.verificationCode.validate.useMutation();

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

		sendMagicLinkMutation
			.mutateAsync({ emailAddress })
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
	}, [toast, setResendCodeCountdown, sendMagicLinkMutation, emailAddress]);

	if (!emailAddress) {
		redirect("/sign-in");
	}

	return (
		<>
			<div className="flex justify-center">
				<VerificationCodeInput
					onSubmit={async (verificationCode) => {
						try {
							await validateVerificationCodeMutation.mutateAsync({ code: verificationCode });

							toast({
								title: "Email address verified",
								description: "Your email address has been successfully verified.",
							});

							const callbackUrl = searchParams?.get("from") || "/";
							const baseUrl = getBaseUrl();

							// Allows relative callback URLs
							if (callbackUrl.startsWith("/")) {
								return router.push(callbackUrl);
							}
							// Allows callback URLs on the same origin
							if (new URL(callbackUrl).origin === baseUrl) {
								return router.push(callbackUrl);
							}

							router.push(baseUrl);
						} catch (error) {
							if (error instanceof TRPCError) {
								if (error.code === "BAD_REQUEST" || error.code === "NOT_FOUND") {
									toast({
										title: "Invalid verification code",
										description:
											typeof error.message === "string"
												? error.message
												: "The verification code you provided is invalid or expired. Please request a new one and try again.",
										variant: "destructive",
									});
								} else {
									toast({
										title: `Failed to verify your email address`,
										description: `An unknown error occurred while trying to verify your email address. Please try again.`,
										variant: "destructive",
									});
								}
							}

							// Re-throw the error so that the form error text
							throw new Error("Invalid verification code");
						}
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
