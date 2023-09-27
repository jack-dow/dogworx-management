"use client";

import * as React from "react";
import { TRPCError } from "@trpc/server";

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
import { api } from "~/lib/trpc/client";

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

	const sendVerificationCodeMutation = api.auth.signIn.verificationCode.send.useMutation();
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

		if (emailAddress) {
			sendVerificationCodeMutation
				.mutateAsync({ emailAddress })
				.then(() => {
					setResendCodeCountdown(60);
					setSentFirstEmail(true);
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
		}
	}, [toast, setResendCodeCountdown, sendVerificationCodeMutation, emailAddress]);

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
								try {
									await validateVerificationCodeMutation.mutateAsync({ code: verificationCode });

									setOpen(false);
									toast({
										title: "Email address updated",
										description: "Your email address has successfully been updated.",
									});
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
