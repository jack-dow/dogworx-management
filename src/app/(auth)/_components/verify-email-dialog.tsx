"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { VerificationCodeInput } from "~/components/ui/verification-code-input";
import { attemptEmailVerification } from "./attempt-email-verification-server-action";

function VerifyEmailAlertDialog({
	email,
	open,
	setOpen,
}: {
	email: string | null;
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const router = useRouter();
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
			await fetch("/api/auth/send-verify-email", {
				method: "POST",
				body: JSON.stringify({ email }),
			});
		}

		sendEmail()
			.then(() => {
				toast({
					title: "Verification code sent",
					description: "We've sent a new verification code to your email address.",
				});
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
	}, [email, toast, setSentFirstEmail, setResendCodeCountdown]);

	React.useEffect(() => {
		if (open && !sentFirstEmail) {
			handleSendEmail();
		}
	}, [open, sentFirstEmail, handleSendEmail]);

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogContent className="sm:max-w-[425px]">
				<AlertDialogHeader className="space-y-1">
					<AlertDialogTitle>Verify email address</AlertDialogTitle>
					<AlertDialogDescription>
						We&apos;ve sent a verification code to <span className="font-medium">{email}</span>
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="flex justify-center">
					<VerificationCodeInput
						onSubmit={async (verificationCode) => {
							try {
								if (email) {
									const result = await attemptEmailVerification({ email, verificationCode });

									if (result.success) {
										setOpen(false);
										router.push("/dashboard");
									} else {
										// Throw error on incorrect code to have input show error state
										throw new Error("Failed to verify email address");
									}

									toast({
										title: result.title,
										description: result.description,
										variant: result.success ? "default" : "destructive",
									});
								}
							} catch (error) {
								throw new Error("Failed to verify email address");
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
						}}
					>
						{"Didn't receive an email? Click here to resend. "}
						{resendCodeCountdown > 0 ? `(${resendCodeCountdown})` : ""}
					</Button>
				</div>

				<AlertDialogFooter>
					<Button type="button" variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export { VerifyEmailAlertDialog };
