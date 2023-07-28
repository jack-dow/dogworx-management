"use client";

import * as React from "react";

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
import { type VerifyNewEmailGETResponse } from "~/app/api/auth/verify-new-email/route";
import { type VerifyNewEmailSendPOSTResponse } from "~/app/api/auth/verify-new-email/send/route";

function AccountVerifyNewEmailAddressDialog({
	emailAddress,
	open,
	setOpen,
}: {
	emailAddress: string | null;
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
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
			const response = await fetch("/api/auth/verify-new-email/send", {
				method: "POST",
				body: JSON.stringify({ emailAddress }),
			});

			const body = (await response.json()) as VerifyNewEmailSendPOSTResponse;

			return body;
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
						<AlertDialogTitle>Verify new email address</AlertDialogTitle>
						<AlertDialogDescription>
							We&apos;ve sent a verification code to <span className="font-medium">{emailAddress}</span>
						</AlertDialogDescription>
					</AlertDialogHeader>

					<div className="flex justify-center">
						<VerificationCodeInput
							onSubmit={async (verificationCode) => {
								if (emailAddress) {
									const response = await fetch(`/api/auth/verify-new-email?code=${verificationCode}`);

									const body = (await response.json()) as VerifyNewEmailGETResponse;

									if (!body.success) {
										if (body.error.code === "Expired") {
											toast({
												title: "Verification code expired",
												description:
													"The verification code you provided has expired. Please request another and try again.",
												variant: "destructive",
											});
										}
										if (body.error.code === "Invalid") {
											throw new Error("Invalid verification code");
										}
										if (body.error.code === "NotAuthorized") {
											toast({
												title: "Not authorized",
												description: "You are not authorized to perform this action",
												variant: "destructive",
											});
										}
									}

									if (!response.ok) {
										toast({
											title: `Failed to verify code`,
											description: `An unknown error occurred while trying to verify this code. Please try again.`,
											variant: "destructive",
										});
										throw new Error("Failed to verify email address");
									}

									setOpen(false);
									toast({
										title: "Email address updated",
										description: "Your email address has successfully been updated.",
									});
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

export { AccountVerifyNewEmailAddressDialog };
