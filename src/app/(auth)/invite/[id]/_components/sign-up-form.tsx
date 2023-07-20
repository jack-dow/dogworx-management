"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import bcrypt from "bcryptjs";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { PasswordInput } from "~/components/ui/password-input";
import { useToast } from "~/components/ui/use-toast";
import { AdapterDrizzle } from "~/lib/next-auth-adapter-drizzle";
import { AuthSchema } from "~/lib/validation";

function SignUpForm() {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const [isPending, startTransition] = React.useTransition();

	// react-hook-form
	const form = useForm<AuthSchema>({
		resolver: zodResolver(AuthSchema),
		defaultValues: {
			givenName: "",
			familyName: "",
			email: "",
			password: "",
		},
	});

	async function onSubmit(data: AuthSchema) {
		try {
			const salt = bcrypt.genSaltSync(10);
			const hashedPassword = bcrypt.hashSync(data.password, salt);

			const user = await AdapterDrizzle().createUser({
				email: data.email,
				password: hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date(),
				name: "Testing User",
				givenName: "Testing",
				familyName: "User",
				emailVerified: null,
			});
		} catch (error) {
			console.log(error);
			toast({
				title: `An unknown error occurred`,
				description: "Something went wrong, please try again.",
			});
		}
		console.log(data);
		// startTransition(async () => {
		// 	try {
		// 		router.push("/sign-up/verify-email");
		// 		toast({
		// 			title: "Check your email",
		// 			description: "We sent you a 6-digit verification code.",
		// 		});
		// 	} catch (error) {

		// 	}
		// });
	}

	return (
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
						<FormItem className="col-span-2">
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
						<FormItem className="col-span-2">
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
					name="email"
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
				<Button type="submit" disabled={isPending}>
					{isPending && <Loader size="sm" aria-hidden="true" />}
					Continue
					<span className="sr-only">Continue to email verification page</span>
				</Button>
			</form>
		</Form>
	);
}

export { SignUpForm };
