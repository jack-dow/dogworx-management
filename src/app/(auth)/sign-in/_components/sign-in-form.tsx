"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { PasswordInput } from "~/components/ui/password-input";
import { useToast } from "~/components/ui/use-toast";
import { AuthSchema } from "~/lib/validation";

function SignInForm() {
	const router = useRouter();
	const { toast } = useToast();
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
		startTransition(async () => {
			try {
				const result = await signIn("credentials", {
					email: data.email,
					password: data.password,
				});

				if (result?.ok) {
					router.push(`${window.location.origin}/`);
				} else {
					/*Investigate why the login hasn't completed */
					console.log(result);
				}
			} catch (error) {
				toast({
					title: `An unknown error occurred`,
					description: "Something went wrong, please try again.",
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
				<Button type="submit" disabled={isPending}>
					{isPending && <Loader aria-hidden="true" size="sm" />}
					Continue
				</Button>
			</form>
		</Form>
	);
}

export { SignInForm };
