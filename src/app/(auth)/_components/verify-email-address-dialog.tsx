"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { RefreshOnFocus } from "~/components/refresh-on-focus";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { VerificationCodeInput } from "~/components/ui/verification-code-input";
import { type SendMagicLinkPOSTResponse } from "~/app/api/auth/sign-in/magic-link/send/route";
import { getBaseUrl } from "~/utils";

function VerifyEmailAddressAlertDialog({
	emailAddress,
	open,
	setOpen,
	type,
}: {
	emailAddress: string | null;
	open: boolean;
	setOpen: (open: boolean) => void;
	type: "sign-in" | "sign-up";
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isSignUp = type === "sign-up";
	const { toast } = useToast();
	const [isLoading, setIsLoading] = React.useState(true);
	const [sentFirstEmail, setSentFirstEmail] = React.useState(false);
	const [resendCodeCountdown, setResendCodeCountdown] = React.useState(0);

	React.useEffect(() => {
		let timer: NodeJS.Timer;

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
			if (process.env.NODE_ENV !== "development") {
				const response = await fetch("/api/auth/sign-in/magic-link/send", {
					method: "POST",
					body: JSON.stringify({ emailAddress }),
				});
				const body = (await response.json()) as SendMagicLinkPOSTResponse;
				return body;
			}
		}

		sendEmail()
			.then(() => {
				setSentFirstEmail(true);
				setResendCodeCountdown(60);
			})
			.catch(() => {
				toast({
					title: "Failed to send verification code",
					description:
						"An unknown error occurred while trying to send a new verification code to your email address. Please try again later.",
				});
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [emailAddress, toast, setSentFirstEmail, setResendCodeCountdown]);

	React.useEffect(() => {
		if (open && !sentFirstEmail) {
			handleSendEmail();
		}
	}, [open, sentFirstEmail, handleSendEmail]);

	return (
		<>
			{open && <RefreshOnFocus />}

			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent className="sm:max-w-[425px]">
					<AlertDialogHeader className="space-y-1">
						<AlertDialogTitle>{isSignUp ? "Verify email address" : "Sign in with code"}</AlertDialogTitle>
						<AlertDialogDescription>
							We&apos;ve sent a verification code to <span className="font-medium">{emailAddress}</span>
						</AlertDialogDescription>
					</AlertDialogHeader>

					<div className="flex justify-center">
						<VerificationCodeInput
							onSubmit={async (verificationCode) => {
								if (emailAddress) {
									const response = await fetch(`/api/auth/sign-in/magic-link?code=${verificationCode}`);

									if (response.status !== 200) {
										throw new Error("Failed to verify email address");
									}

									if (!response.ok) {
										toast({
											title: `Failed to ${isSignUp ? "verify email address" : "sign in"}`,
											description: `An unknown error occurred while trying to ${
												isSignUp ? "verify your email address" : "sign in"
											}. Please try again later.`,
										});
										throw new Error("Failed to verify email address");
									}

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
								}
							}}
						/>
					</div>

					<div>
						<Button
							type="button"
							variant="link"
							className="-ml-4"
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
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export { VerifyEmailAddressAlertDialog };
