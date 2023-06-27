"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { isClerkAPIResponseError, useSignUp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import { VerifyEmailSchema } from "~/lib/validations/auth";

function VerifyEmailForm() {
	const router = useRouter();
	const { toast } = useToast();
	const { isLoaded, signUp, setActive } = useSignUp();
	const [isPending, startTransition] = React.useTransition();

	// react-hook-form
	const form = useForm<VerifyEmailSchema>({
		resolver: zodResolver(VerifyEmailSchema),
		defaultValues: {
			code: "",
		},
	});

	function onSubmit(data: VerifyEmailSchema) {
		if (!isLoaded) return;

		startTransition(async () => {
			try {
				const completeSignUp = await signUp.attemptEmailAddressVerification({
					code: data.code,
				});
				if (completeSignUp.status !== "complete") {
					/*  investigate the response, to see if there was an error
             or if the user needs to complete more steps.*/
					console.log(JSON.stringify(completeSignUp, null, 2));
				}
				if (completeSignUp.status === "complete") {
					await setActive({ session: completeSignUp.createdSessionId });

					router.push(`${window.location.origin}/`);
				}
			} catch (error) {
				const unknownError = "Something went wrong, please try again.";

				isClerkAPIResponseError(error)
					? toast({
							title: `Failed to verify your email`,
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
					name="code"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Verification Code</FormLabel>
							<FormControl>
								<Input
									placeholder="169420"
									{...field}
									onChange={(e) => {
										e.target.value = e.target.value.trim();
										field.onChange(e);
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button disabled={isPending}>
					{isPending && <Loader className="mr-2" size="sm" aria-hidden="true" />}
					Create account
					<span className="sr-only">Create account</span>
				</Button>
			</form>
		</Form>
	);
}

export { VerifyEmailForm };
