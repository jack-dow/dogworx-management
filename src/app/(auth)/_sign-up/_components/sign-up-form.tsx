"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { isClerkAPIResponseError, useSignUp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { PasswordInput } from "~/components/ui/password-input";
import { useToast } from "~/components/ui/use-toast";
import { AuthSchema } from "~/lib/validations/auth";

function SignUpForm() {
	const router = useRouter();
	const { toast } = useToast();
	const { isLoaded, signUp } = useSignUp();
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
				await signUp.create({
					emailAddress: data.email,
					password: data.password,
				});

				// Send email verification code
				await signUp.prepareEmailAddressVerification({
					strategy: "email_code",
				});

				router.push("/sign-up/verify-email");

				toast({
					title: "Check your email",
					description: "We sent you a 6-digit verification code.",
				});
			} catch (error) {
				const unknownError = "Something went wrong, please try again.";

				isClerkAPIResponseError(error)
					? toast({
							title: `Failed to sign up`,
							description: error.errors[0]?.longMessage ?? unknownError,
					  })
					: toast({
							title: `An unknown error occurred`,
							description: unknownError,
					  });
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
					{isPending && <Loader className="mr-2" size="sm" aria-hidden="true" />}
					Continue
					<span className="sr-only">Continue to email verification page</span>
				</Button>
			</form>
		</Form>
	);
}

export { SignUpForm };
