"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { type OrganizationInviteLinkById } from "~/actions";
import { VerifyEmailAlertDialog } from "~/app/(auth)/_components/verify-email-dialog";
import { signUp } from "~/lib/auth";
import { SignUpSchema } from "~/lib/validation";

function InviteForm({ inviteLink }: { inviteLink: OrganizationInviteLinkById }) {
	const { toast } = useToast();
	const [verifyEmail, setVerifyEmail] = React.useState<string | null>(null);

	const form = useForm<SignUpSchema>({
		resolver: zodResolver(SignUpSchema),
		defaultValues: {
			givenName: "Jack",
			familyName: "",
			emailAddress: "jdooow@gmail.com",
		},
	});

	async function onSubmit(data: SignUpSchema) {
		if (form.formState.errors.emailAddress) {
			form.setError("emailAddress", {
				type: "manual",
				message: form.formState.errors.emailAddress.message,
			});

			return;
		}

		try {
			const signUpResponse = await signUp(data, inviteLink);

			if (!signUpResponse.success) {
				if (signUpResponse.error.code === "AlreadyExists") {
					form.setError("emailAddress", {
						type: "manual",
						message: "Email already in use",
					});
					toast({
						title: "Email already in use",
						description: "This email is already in use. Please try again.",
						variant: "destructive",
					});
					return;
				}

				toast({
					title: "Something went wrong.",
					description: "Your sign up request failed. Please try again.",
					variant: "destructive",
				});
				return;
			}

			setVerifyEmail(data.emailAddress);
		} catch (error) {
			toast({
				title: `An unknown error occurred`,
				description: "Something went wrong, please try again.",
			});
		}
	}

	return (
		<>
			<VerifyEmailAlertDialog
				emailAddress={verifyEmail}
				open={!!verifyEmail}
				setOpen={(open) => {
					if (!open) {
						setVerifyEmail(null);
					}
				}}
				type="sign-up"
			/>

			<Form {...form}>
				<form
					className="grid grid-cols-2 gap-4"
					onSubmit={(e) => {
						e.stopPropagation();
						e.preventDefault();

						void form.handleSubmit(onSubmit)(e);
					}}
				>
					<FormField
						control={form.control}
						name="givenName"
						render={({ field }) => (
							<FormItem className="col-span-1">
								<FormLabel>First Name</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="familyName"
						render={({ field }) => (
							<FormItem className="col-span-1">
								<div className="flex items-center justify-between">
									<FormLabel>Last Name</FormLabel>
									<span className="text-[0.8rem] text-muted-foreground">Optional</span>
								</div>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="emailAddress"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button type="submit" disabled={form.formState.isSubmitting} className="col-span-2">
						{form.formState.isSubmitting && <Loader size="sm" aria-hidden="true" />}
						Continue
						<span className="sr-only">Continue to email verification page</span>
					</Button>
				</form>
			</Form>
		</>
	);
}

export { InviteForm };
