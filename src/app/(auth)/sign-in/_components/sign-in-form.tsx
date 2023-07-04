"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { isClerkAPIResponseError, useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { PasswordInput } from "~/components/ui/password-input";
import { useToast } from "~/components/ui/use-toast";
import { AuthSchema } from "~/lib/validations/auth";

function SignInForm() {
	const router = useRouter();
	const { toast } = useToast();
	const { isLoaded, signIn, setActive } = useSignIn();
	const [isPending, startTransition] = React.useTransition();

	// react-hook-form
	const form = useForm<AuthSchema>({
		resolver: zodResolver(AuthSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	function onSubmit(data: AuthSchema) {
		if (!isLoaded) return;

		startTransition(async () => {
			try {
				const result = await signIn.create({
					identifier: data.email,
					password: data.password,
				});

				if (result.status === "complete") {
					await setActive({ session: result.createdSessionId });

					router.push(`${window.location.origin}/`);
				} else {
					/*Investigate why the login hasn't completed */
					console.log(result);
				}
			} catch (error) {
				const unknownError = "Something went wrong, please try again.";

				if (isClerkAPIResponseError(error)) {
					console.log(error.errors);
					if (error.errors[0]?.code === "session_exists") {
						toast({
							title: `You are already signed in`,
							description: "To sign into another account, please sign out of your current account first.",
						});
						return;
					}

					if (
						error.errors[0]?.code === "form_password_incorrect" ||
						error.errors[0]?.code === "form_identifier_not_found"
					) {
						form.setError("email", { type: "manual", message: "Invalid email or password" });
						form.setError("password", { type: "manual", message: "Invalid email or password" });
						return;
					}

					toast({
						title: `Failed to sign in`,
						description: error.errors[0]?.longMessage ?? unknownError,
					});
				} else {
					toast({
						title: `An unknown error occurred`,
						description: unknownError,
					});
				}
			}
		});
	}

	return (
		<Form {...form}>
			<form className="grid gap-4" onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}>
				<FormField
					control={form.control}
					name="email"
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
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<PasswordInput {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button disabled={isPending}>
					{isPending && <Loader aria-hidden="true" size="sm" />}
					Continue
				</Button>
			</form>
		</Form>
	);
}

export { SignInForm };
