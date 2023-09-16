"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { type SendMagicLinkPOSTResponse } from "~/app/api/auth/sign-in/magic-link/send/route";
import { SignInSchema } from "~/lib/client-utils";
import { VerifyEmailAddressAlertDialog } from "./verify-email-address-dialog";

function SignInForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toast } = useToast();

	const [verifyEmail, setVerifyEmail] = React.useState<string | null>(null);

	const form = useForm<SignInSchema>({
		resolver: zodResolver(SignInSchema),
		defaultValues: {
			emailAddress: "",
		},
	});

	const redirectedFrom = searchParams.get("ref");

	async function onSubmit(data: SignInSchema) {
		if (process.env.NODE_ENV === "development" || data.emailAddress.toLowerCase() === "test@dogworx.com.au") {
			setVerifyEmail(data.emailAddress);
			return;
		}

		const response = await fetch("/api/auth/sign-in/magic-link/send", {
			method: "POST",
			body: JSON.stringify({ emailAddress: data.emailAddress }),
		});
		const body = (await response.json()) as SendMagicLinkPOSTResponse;

		if (body.success) {
			setVerifyEmail(data.emailAddress);
			toast({
				title: "Verification code sent",
				description: "Please check your email for the code and magic link.",
			});
			return;
		}

		if (body.error.code === "NoUserFound") {
			form.setError("emailAddress", {
				type: "manual",
				message: "Account not found",
			});
			toast({
				title: "Unknown email address",
				description: "We couldn't find a user with that email address. Please try again.",
				variant: "destructive",
			});
			return;
		}

		toast({
			title: "Something went wrong",
			description: "An unknown error ocurred and your sign in request failed. Please try again.",
			variant: "destructive",
		});
	}

	React.useEffect(() => {
		if (redirectedFrom === "magic-link") {
			// HACK: If it is not wrapped in a setTimeout it will not render
			setTimeout(() => {
				toast({
					title: "Invalid or expired magic link",
					description: "Please sign in again to get a new magic link.",
					variant: "destructive",
				});
			}, 0);
			router.replace("/sign-in");
		}
	}, [redirectedFrom, router, toast]);

	return (
		<>
			<VerifyEmailAddressAlertDialog
				emailAddress={verifyEmail}
				open={!!verifyEmail}
				setOpen={(open) => {
					if (!open) {
						setVerifyEmail(null);
					}
				}}
				type="sign-in"
			/>
			<Form {...form}>
				<form className="grid gap-4" onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}>
					<FormField
						control={form.control}
						name="emailAddress"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting && <Loader aria-hidden="true" size="sm" />}
						Continue
					</Button>
				</form>
			</Form>
		</>
	);
}

export { SignInForm };
