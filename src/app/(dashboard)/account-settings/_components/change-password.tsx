"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { type Control } from "react-hook-form";

import { Checkbox } from "~/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { PasswordInput } from "~/components/ui/password-input";
import { type AccountSettingsPageFormSchema } from "./account-settings-page-form";

function ChangePassword({ control }: { control: Control<AccountSettingsPageFormSchema> }) {
	const { user } = useUser();

	if (!user) return null;
	return (
		<div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">
					{user.passwordEnabled ? "Change" : "Set"} Password
				</h2>
				{/* <p className="text-sm leading-6 text-muted-foreground">This will be used to log into your account.</p> */}
			</div>
			<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 md:col-span-2">
				<div className="space-y-4 sm:p-8">
					<div>
						{user.passwordEnabled && (
							<FormField
								control={control}
								name="currentPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Current Password</FormLabel>
										<FormControl>
											<PasswordInput {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
					</div>
					<div>
						<FormField
							control={control}
							name="newPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>New Password</FormLabel>
									<FormControl>
										<PasswordInput {...field} value={field.value ?? ""} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div>
						<FormField
							control={control}
							name="newPasswordConfirm"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirm New Password</FormLabel>
									<FormControl>
										<PasswordInput {...field} value={field.value ?? ""} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="flex items-center space-x-2">
						<FormField
							control={control}
							name="signOutOtherSessions"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center space-x-2 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={(checked) => {
												field.onChange(!!checked);
											}}
										/>
									</FormControl>
									<FormLabel className="text-sm font-normal">Sign out of all other sessions</FormLabel>
								</FormItem>
							)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export { ChangePassword };
