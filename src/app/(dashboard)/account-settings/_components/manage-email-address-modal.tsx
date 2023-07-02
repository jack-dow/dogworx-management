import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { type EmailAddressResource } from "@clerk/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { el } from "date-fns/locale";
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
import { prettyStringValidationMessage } from "~/lib/validations/utils";
import { VerifyEmailAddressCodeInput } from "./verify-email-address-code-input";

const AddEmailAddressFormSchema = z.object({
	emailAddress: prettyStringValidationMessage("Email address", 1, 100).email(),
});
type AddEmailAddressFormValues = z.infer<typeof AddEmailAddressFormSchema>;

type ManageEmailAddressModalProps = {
	open: boolean;
	setOpen: (open: boolean) => void;
	emailAddress?: EmailAddressResource;
};

function ManageEmailAddressModal({ open, setOpen, emailAddress }: ManageEmailAddressModalProps) {
	const { user } = useUser();
	const { toast } = useToast();

	const [isVerifyingEmailAddress, setIsVerifyingEmailAddress] = React.useState(!!emailAddress);
	const [emailAddressResource, setEmailAddressResource] = React.useState<EmailAddressResource | null>(
		emailAddress ?? null,
	);

	const addEmailAddressForm = useForm<AddEmailAddressFormValues>({
		resolver: zodResolver(AddEmailAddressFormSchema),
	});

	React.useEffect(() => {
		if (open && emailAddress) {
			setIsVerifyingEmailAddress(true);
			void emailAddress.prepareVerification({ strategy: "email_code" });
		}
	}, [open, emailAddress]);

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
										await emailAddressResource?.attemptVerification({ code });
										setOpen(false);
										toast({
											title: "Email address verified",
											description: "Your email address has been successfully verified. You can now use it to sign in.",
										});
									} catch (error) {
										console.error(error);
										toast({
											title: "Failed to verify email address",
											description:
												"An unknown error occurred while trying to verify your email address. Please try again later.",
										});
									}
								}}
							/>
						</div>
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
											}
											toast({
												title: "Email address added",
												description: "An email containing a verification code has been sent to your email address.",
											});
											setIsVerifyingEmailAddress(true);
										} catch (error) {
											console.error(error);
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
											<FormItem className="grid grid-cols-4 items-center gap-4">
												<FormLabel className="text-right">Email</FormLabel>
												<FormControl>
													<Input {...field} value={field.value ?? ""} className="col-span-3" />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<DialogFooter>
									<Button type="submit" disabled={addEmailAddressForm.formState.isSubmitting}>
										{addEmailAddressForm.formState.isSubmitting && <Loader className="mr-2" size="sm" />}
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

export { ManageEmailAddressModal };
