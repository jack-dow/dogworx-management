"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { SignInSchema } from "~/lib/validation";
import { VerifyEmailAlertDialog } from "../../_components/verify-email-dialog";

function SignInForm() {
	const [verifyEmail, setVerifyEmail] = React.useState<string | null>(null);

	const form = useForm<SignInSchema>({
		resolver: zodResolver(SignInSchema),
		defaultValues: {
			emailAddress: "",
		},
	});

	function onSubmit(data: SignInSchema) {
		setVerifyEmail(data.emailAddress);
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
