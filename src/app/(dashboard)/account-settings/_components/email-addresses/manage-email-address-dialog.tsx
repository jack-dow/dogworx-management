"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { type ClerkAPIError, type EmailAddressResource } from "@clerk/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { VerifyEmailAddressCodeInput } from "./verify-email-address-code-input";

const AddEmailAddressFormSchema = z.object({
	emailAddress: z.string().email().max(100),
});
type AddEmailAddressFormValues = z.infer<typeof AddEmailAddressFormSchema>;

type ManageEmailAddressDialogProps = {
	open: boolean;
	setOpen: (open: boolean) => void;
	emailAddress?: EmailAddressResource;
	onAddEmailAddress: (emailAddress: EmailAddressResource) => void;
	onSuccessfulVerification: (emailAddress: EmailAddressResource) => void;
};

function ManageEmailAddressDialog({
	open,
	setOpen,
	emailAddress,
	onAddEmailAddress,
	onSuccessfulVerification,
}: ManageEmailAddressDialogProps) {
	const { user } = useUser();
	const { toast } = useToast();

	const [isVerifyingEmailAddress, setIsVerifyingEmailAddress] = React.useState(!!emailAddress);
	const [emailAddressResource, setEmailAddressResource] = React.useState<EmailAddressResource | null>(
		emailAddress ?? null,
	);
	const [resendCodeCountdown, setResendCodeCountdown] = React.useState(0);

	const addEmailAddressForm = useForm<AddEmailAddressFormValues>({
		resolver: zodResolver(AddEmailAddressFormSchema),
	});

	React.useEffect(() => {
		if (open && emailAddress) {
			setIsVerifyingEmailAddress(!!emailAddress);
			setEmailAddressResource(emailAddress ?? null);
			void emailAddress.prepareVerification({ strategy: "email_code" });
			setResendCodeCountdown(60);
		}
	}, [open, emailAddress]);

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

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-[425px]">
				{isVerifyingEmailAddress ? (
					<>
						<DialogHeader>
							<DialogTitle>Verify email address</DialogTitle>
							<DialogDescription>
								An email containing a verification code has been sent to your email address.
							</DialogDescription>
						</DialogHeader>

						<div>
							<VerifyEmailAddressCodeInput
								onSubmit={async (code) => {
									try {
										const result = await emailAddressResource?.attemptVerification({ code });

										if (result?.verification.status === "verified") {
											onSuccessfulVerification(result);
										}

										setOpen(false);
										toast({
											title: "Email address verified",
											description: "Your email address has been successfully verified. You can now use it to sign in.",
										});
									} catch (error) {
										if (error && typeof error === "object" && "errors" in error) {
											if (Array.isArray(error.errors)) {
												const clerkError = error.errors[0] as ClerkAPIError;
												if (clerkError && clerkError.code === "form_code_incorrect") {
													// Must rethrow error to display error state
													throw new Error("Invalid code");
												}
											}
										}
										toast({
											title: "Failed to verify email address",
											description:
												"An unknown error occurred while trying to verify your email address. Please try again later.",
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
								disabled={resendCodeCountdown > 0}
								onClick={() => {
									void emailAddressResource?.prepareVerification({ strategy: "email_code" });
									setResendCodeCountdown(60);
								}}
							>
								{"Didn't receive an email? Click here to resend. "}
								{resendCodeCountdown > 0 ? `(${resendCodeCountdown})` : ""}
							</Button>
						</div>

						<DialogFooter>
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Add email address</DialogTitle>
							<DialogDescription>
								An email containing a verification code will be sent to this email address.
							</DialogDescription>
						</DialogHeader>
						<Form {...addEmailAddressForm}>
							<form
								className="grid gap-4"
								onSubmit={(e) => {
									e.stopPropagation();
									e.preventDefault();

									void addEmailAddressForm.handleSubmit(async (data) => {
										try {
											const result = await user?.createEmailAddress({ email: data.emailAddress });
											if (result) {
												setEmailAddressResource(result);
												await result.prepareVerification({ strategy: "email_code" });
												setResendCodeCountdown(60);
												onAddEmailAddress(result);
											}
											toast({
												title: "Email address added",
												description: "An email containing a verification code has been sent to your email address.",
											});
											setIsVerifyingEmailAddress(true);
										} catch (error: unknown) {
											if (error && typeof error === "object" && "errors" in error) {
												if (Array.isArray(error.errors)) {
													const clerkError = error.errors[0] as ClerkAPIError;
													if (clerkError && clerkError.code === "form_identifier_exists") {
														addEmailAddressForm.setError("emailAddress", {
															type: "manual",
															message: "This email address is already in use. Please try another.",
														});
														return;
													}
												}
											}

											toast({
												title: "Failed to add email address",
												description:
													"An unknown error occurred while trying to add your email address. Please try again later.",
											});
										}
									})(e);
								}}
							>
								<div className="grid gap-4 py-4">
									<FormField
										control={addEmailAddressForm.control}
										name="emailAddress"
										render={({ field }) => (
											<FormItem className="grid grid-cols-4 items-center gap-x-4 gap-y-2 space-y-0">
												<FormLabel className="text-right">Email</FormLabel>
												<FormControl>
													<Input {...field} value={field.value ?? ""} className="col-span-3" />
												</FormControl>
												<FormMessage className="col-span-3 col-start-2" />
											</FormItem>
										)}
									/>
								</div>
								<DialogFooter>
									<Button type="submit" disabled={addEmailAddressForm.formState.isSubmitting}>
										{addEmailAddressForm.formState.isSubmitting && <Loader size="sm" />}
										Continue
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

export { ManageEmailAddressDialog };
