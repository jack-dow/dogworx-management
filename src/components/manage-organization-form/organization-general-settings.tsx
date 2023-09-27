"use client";

import * as React from "react";
import Link from "next/link";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
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
import { useUser } from "~/app/providers";
import { env } from "~/env.mjs";
import { RichTextEditor } from "../ui/rich-text-editor";
import { type ManageOrganizationFormSchema } from "./manage-organization-form";

function OrganizationGeneralSettings() {
	const form = useFormContext<ManageOrganizationFormSchema>();

	const user = useUser();

	return (
		<FormSection
			title="General Settings"
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
								<FormLabel>Organization Name</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} disabled={user.organizationRole === "member"} />
								</FormControl>
								<FormDescription>This will be displayed publicly on emails, invoices, etc.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="space-y-2 sm:col-span-6">
					<FormField
						control={form.control}
						name="emailAddress"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Organization Email</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} disabled={user.organizationRole === "member"} />
								</FormControl>
								<FormDescription>This is how customers can contact you.</FormDescription>
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
										disabled={user.organizationRole === "member"}
									/>
								</FormControl>
								<FormLabel>CC emails to organization owners and administrators.</FormLabel>
							</FormItem>
						)}
					/>
				</div>

				{user.organizationId === env.NEXT_PUBLIC_ADMIN_ORG_ID && (
					<>
						<div className="sm:col-span-6">
							<FormField
								control={form.control}
								name="maxUsers"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Max Users</FormLabel>
										<FormControl>
											<Input
												type="number"
												{...field}
												value={field.value ?? ""}
												onChange={(e) => {
													field.onChange(e.target.value ? Number(e.target.value) : null);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="sm:col-span-6">
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes</FormLabel>
										<FormControl>
											<RichTextEditor content={field.value ?? ""} onValueChange={({ html }) => field.onChange(html)} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</>
				)}
			</FormGroup>
		</FormSection>
	);
}

export { OrganizationGeneralSettings };
