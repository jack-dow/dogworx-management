"use client";

import * as React from "react";
import { type Control } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { type ManageAccountFormSchema } from "./manage-account-form";

function AccountEmailAddress({ control }: { control: Control<ManageAccountFormSchema> }) {
	return (
		<div className="grid grid-cols-1 gap-2 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Email address</h2>
				<p className="text-sm leading-6 text-muted-foreground">
					This will be used to sign in, provide reports and receipts, and send you notifications.
				</p>
			</div>

			<div className="xl:col-span-2">
				<FormField
					control={control}
					name="emailAddress"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="sr-only">Email address</FormLabel>
							<FormControl>
								<Input {...field} value={field.value ?? ""} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
}

export { AccountEmailAddress };
