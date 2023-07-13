"use client";

import * as React from "react";
import { type Control } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { type AccountSettingsPageFormSchema } from "./account-settings-page-form";

function DisplayName({ control }: { control: Control<AccountSettingsPageFormSchema> }) {
	return (
		<div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Display Name</h2>
				<p className="text-sm leading-6 text-muted-foreground">This will be displayed publicly as your name.</p>
			</div>

			<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 md:col-span-2">
				<div className="sm:p-8">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-6 sm:gap-y-6">
						<div className="sm:col-span-3">
							<FormField
								control={control}
								name="givenName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First name</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="sm:col-span-3">
							<FormField
								control={control}
								name="familyName"
								render={({ field }) => (
									<FormItem>
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
			</div>
		</div>
	);
}

export { DisplayName };
