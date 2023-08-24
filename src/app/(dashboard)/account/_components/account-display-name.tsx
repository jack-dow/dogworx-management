"use client";

import * as React from "react";
import { type Control } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { type ManageAccountFormSchema } from "./manage-account-form";

function AccountDisplayName({ control }: { control: Control<ManageAccountFormSchema> }) {
	return (
		<div className="grid grid-cols-1 gap-2 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Display name</h2>
				<p className="text-sm leading-6 text-muted-foreground">This will be displayed publicly as your name.</p>
			</div>

			<div className="flex flex-col gap-2 xl:col-span-2 xl:flex-row xl:gap-4">
				<div className="flex w-full flex-1">
					<FormField
						control={control}
						name="givenName"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>First name</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex w-full flex-1">
					<FormField
						control={control}
						name="familyName"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>Last name</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
		</div>
	);
}

export { AccountDisplayName };
