"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { PasswordInput } from "~/components/ui/password-input";
import { useToast } from "~/components/ui/use-toast";
import { type OrganizationInviteLinkById } from "~/api";
import { VerifyEmailAlertDialog } from "~/app/(auth)/_components/verify-email-dialog";
import { signUp } from "~/lib/auth";
import { CredentialsSignUpSchema } from "~/lib/validation";

function SignUpForm({ inviteLink }: { inviteLink: OrganizationInviteLinkById }) {
	const router = useRouter();
	const { toast } = useToast();
	const [verifyEmail, setVerifyEmail] = React.useState<string | null>(null);

	const form = useForm<CredentialsSignUpSchema>({
		resolver: zodResolver(CredentialsSignUpSchema),
		defaultValues: {
			givenName: "Jack",
			familyName: "",
			emailAddress: "jdooow@gmail.com",
			password: "12345678",
		},
	});

	async function onSubmit(data: CredentialsSignUpSchema) {
		if (form.formState.errors.emailAddress) {
			form.setError("emailAddress", {
				type: "manual",
				message: form.formState.errors.emailAddress.message,
			});

			return;
		}

		try {
			const signUpResponse = await signUp(data, inviteLink);

			if (!signUpResponse.signUp.success) {
				if (signUpResponse.signUp.error.code === "AlreadyExists") {
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
			} else {
				if (!signUpResponse.signIn?.success) {
					toast({
						title: "Something went wrong.",
						description: "We failed to sign you in after your account was created. Please try again.",
						variant: "destructive",
					});
					router.push("/sign-in");
					return;
				}
			}

			router.push("/dashboard");

			// setVerifyEmail(data.emailAddress);
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
				email={verifyEmail}
				open={!!verifyEmail}
				setOpen={(open) => {
					if (!open) {
						setVerifyEmail(null);
					}
				}}
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
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Password</FormLabel>
								<FormControl>
									<PasswordInput {...field} />
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

export { SignUpForm };