"use client";

import * as React from "react";
import Link from "next/link";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
// import { Checkbox } from "~/components/ui/checkbox";
import {
	FormControl,
	FormDescription,
	FormField,
	FormGroup,
	FormItem,
	FormLabel,
	FormMessage,
	FormSection,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { type OrganizationSettingsFormSchema } from "./organization-settings-form";

function OrganizationSettings() {
	const form = useFormContext<OrganizationSettingsFormSchema>();

	return (
		<FormSection
			title="Settings"
			description={
				<>
					These are the settings for your organization. Visit your{" "}
					<Button variant="link" asChild className="h-auto p-0">
						<Link href="/account">personal settings</Link>
					</Button>{" "}
					to edit your name, email, and other settings related to your account.
				</>
			}
		>
			<FormGroup>
				<div className="sm:col-span-6">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<div>
									<FormLabel>Organization Name</FormLabel>
									<FormDescription>This will be displayed publicly on emails, invoices, etc.</FormDescription>
								</div>
								<FormControl>
									<Input {...field} value={field.value ?? ""} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				{/* 
				<div className="space-y-2 sm:col-span-6">
					<FormField
						control={form.control}
						name="emailAddress"
						render={({ field }) => (
							<FormItem>
								<div>
									<FormLabel>Organization Email</FormLabel>
									<FormDescription>This is how customers can contact you.</FormDescription>
								</div>
								<FormControl>
									<Input {...field} value={field.value ?? ""} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="notifyAdminsAboutEmails"
						render={({ field }) => (
							<FormItem className="flex items-center space-x-2 space-y-0">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={(checked) => {
											field.onChange(checked);
										}}
									/>
								</FormControl>
								<FormLabel>CC emails to organization owners and administrators.</FormLabel>
							</FormItem>
						)}
					/>
				</div> */}
			</FormGroup>
		</FormSection>
	);
}

export { OrganizationSettings };
