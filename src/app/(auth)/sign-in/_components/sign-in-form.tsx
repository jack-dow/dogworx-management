"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { PasswordInput } from "~/components/ui/password-input";
import { useToast } from "~/components/ui/use-toast";
import { signInWithCredentials } from "~/lib/auth";
import { CredentialsSignInSchema } from "~/lib/validation";

function SignInForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toast } = useToast();

	const [isInvalidCredentials, setIsInvalidCredentials] = React.useState(false);

	const form = useForm<CredentialsSignInSchema>({
		resolver: zodResolver(CredentialsSignInSchema),
		defaultValues: {
			emailAddress: "",
			password: "",
		},
	});

	async function onSubmit(data: CredentialsSignInSchema) {
		if (isInvalidCredentials) {
			toast({
				title: "Invalid credentials",
				description: "Your credentials do not match our records. Please try again.",
				variant: "destructive",
			});
			return;
		}

		try {
			const signInResult = await signInWithCredentials({
				emailAddress: data.emailAddress,
				password: data.password,
			});

			if (!signInResult.success) {
				if (signInResult.error.code === "InvalidCredentials") {
					setIsInvalidCredentials(true);
					toast({
						title: "Invalid credentials",
						description: "Your credentials do not match our records. Please try again.",
						variant: "destructive",
					});
					return;
				}

				return toast({
					title: "Something went wrong.",
					description: "Your sign in request failed. Please try again.",
					variant: "destructive",
				});
			}

			router.push(searchParams?.get("from") || "/dashboard");
		} catch (error) {
			toast({
				title: `An unknown error occurred`,
				description: "Something went wrong, please try again.",
			});
		}
	}

	return (
		<Form {...form}>
			<form className="grid gap-4" onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}>
				<FormField
					control={form.control}
					name="emailAddress"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									{...field}
									onChange={(e) => {
										setIsInvalidCredentials(false);
										field.onChange(e);
									}}
								/>
							</FormControl>
							<FormMessage>{isInvalidCredentials && "Invalid Credentials"}</FormMessage>
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
								<PasswordInput
									{...field}
									onChange={(e) => {
										setIsInvalidCredentials(false);
										field.onChange(e);
									}}
								/>
							</FormControl>
							<FormMessage>{isInvalidCredentials && "Invalid Credentials"}</FormMessage>
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting && <Loader aria-hidden="true" size="sm" />}
					Continue
				</Button>
			</form>
		</Form>
	);
}

export { SignInForm };
