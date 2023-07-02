"use client";

import * as React from "react";
import { withUser, type WithUserProp } from "@clerk/nextjs";
import { type EmailAddressResource } from "@clerk/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { PageHeader } from "~/components/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { PlusIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { PasswordInput } from "~/components/ui/password-input";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { IdSchema } from "~/api";
import { prettyStringValidationMessage } from "~/lib/validations/utils";
import { ManageEmailAddressModal } from "./_components/manage-email-address-modal";

const EmailAddressSchema = z.object({
	id: z.string(),
	emailAddress: z.string().email(),
	verification: z.object({
		status: z.enum(["unverified", "verified", "transferable", "failed", "expired"]).nullish(),
	}),
	destroy: z.function().returns(z.promise(z.void())),
});

const AccountSettingsPageFormSchema = z.object({
	givenName: prettyStringValidationMessage("First Name", 2, 50),
	familyName: prettyStringValidationMessage("Last name", 2, 50).optional(),
	primaryEmailAddressId: z.string().optional(),
	primaryEmailAddress: EmailAddressSchema.optional(),
	emailAddresses: z.array(EmailAddressSchema),
	profileImageUrl: z.string().url().optional(),
	currentPassword: prettyStringValidationMessage("Your current password", 8, 100).optional(),
	newPassword: prettyStringValidationMessage("Your new password", 8, 100).optional(),
	newPasswordConfirm: prettyStringValidationMessage("Your new password", 8, 100).optional(),
	externalAccounts: z.array(
		z.object({
			id: IdSchema,
			provider: z.string(),
			providerAccountId: z.string(),
		}),
	),
});
type AccountSettingsPageFormSchema = z.infer<typeof AccountSettingsPageFormSchema>;

function AccountSettingsPage({ user }: WithUserProp) {
	const [isManageEmailAddressDialogOpen, setIsManageEmailAddressDialogOpen] = React.useState<
		EmailAddressResource | boolean
	>(false);

	const form = useForm<AccountSettingsPageFormSchema>({
		resolver: zodResolver(AccountSettingsPageFormSchema),
		defaultValues: {
			givenName: user.firstName ?? "",
			familyName: user.lastName ?? "",
			primaryEmailAddressId: user.primaryEmailAddressId ?? "",
			primaryEmailAddress: user.primaryEmailAddress ?? undefined,
			emailAddresses: user.emailAddresses ?? [],
			profileImageUrl: user.profileImageUrl,
		},
	});

	const emailAddresses = useFieldArray({
		control: form.control,
		name: "emailAddresses",
		keyName: "rhf-id",
	});

	const onDrop = React.useCallback((acceptedFiles: File[]) => {
		acceptedFiles.forEach((file) => {
			const reader = new FileReader();

			reader.onabort = () => console.log("file reading was aborted");
			reader.onerror = () => console.log("file reading has failed");
			reader.onload = () => {
				// Do whatever you want with the file contents
				const binaryStr = reader.result;
				console.log(binaryStr);
			};
			reader.readAsArrayBuffer(file);
		});
	}, []);

	const { getRootProps, getInputProps } = useDropzone({ onDrop });

	async function onSubmit() {}

	return (
		<>
			<PageHeader title="Account settings" />
			<Form {...form}>
				<form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)} className="space-y-10 ">
					<div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
						<div>
							<h2 className="text-base font-semibold leading-7 text-foreground">Display Name</h2>
							<p className="text-sm leading-6 text-muted-foreground">This will be displayed publicly as your name.</p>
						</div>
						<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-gray-900/5 md:col-span-2">
							<div className="sm:p-8">
								<div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
									<div className="sm:col-span-3">
										<FormField
											control={form.control}
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
											control={form.control}
											name="familyName"
											render={({ field }) => (
												<FormItem optional>
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

					<Separator className="my-4" />

					<div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
						<div>
							<h2 className="text-base font-semibold leading-7 text-foreground">Email Addresses</h2>
							<p className="text-sm leading-6 text-muted-foreground">
								You can use any of your verified emails to sign in and your primary email address will be displayed
								throughout the app to other users.
							</p>
						</div>
						<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-gray-900/5 md:col-span-2">
							<div className="space-y-4 sm:p-8">
								<Accordion type="single" collapsible className="w-full">
									<FormField
										control={form.control}
										name="primaryEmailAddress"
										render={({ field }) => {
											if (!field.value) return <></>;

											return (
												<AccordionItem value={field.value?.emailAddress} key={field.value.id}>
													<AccordionTrigger>
														<div className=" space-x-4">
															<span>{field.value.emailAddress}</span>
															<Badge variant="outline">Primary</Badge>
														</div>
													</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-4">
															{field.value.verification.status === "verified" ? (
																<div>
																	<p className="text-sm font-medium">Primary Email Address</p>
																	<p className="text-xs text-muted-foreground">
																		As your primary email address, this email address will be displayed throughout the
																		app to other users.
																	</p>
																</div>
															) : (
																<div>
																	<p className="text-sm font-medium">Unverified Email Address</p>
																	<p className="text-xs text-muted-foreground">
																		This email address has not been verified. You will not be able to use it to sign in
																		until you verify it. It may also have limited functionality.
																	</p>
																</div>
															)}
															<div>
																<p className="text-sm font-medium">Remove</p>
																<p className="text-xs text-muted-foreground">
																	You cannot remove your primary email address. If you want to remove it, you must first
																	set another email address as your primary email address.
																</p>
															</div>
														</div>
													</AccordionContent>
												</AccordionItem>
											);
										}}
									/>
									{emailAddresses.fields.map((field, index) => (
										<EmailAddressField
											key={index}
											index={index}
											field={field}
											isPrimary={form.getValues("primaryEmailAddressId") === field.id}
											onVerify={(emailAddress) => {
												setIsManageEmailAddressDialogOpen(emailAddress);
											}}
											onDelete={(index) => {
												emailAddresses.remove(index);
											}}
										/>
									))}
								</Accordion>

								<Button
									variant="ghost"
									className="-ml-4"
									onClick={() => {
										setIsManageEmailAddressDialogOpen(true);
									}}
								>
									<PlusIcon className="mr-2 h-4 w-4" /> Add another email address
								</Button>

								<ManageEmailAddressModal
									open={!!isManageEmailAddressDialogOpen}
									setOpen={setIsManageEmailAddressDialogOpen}
									emailAddress={
										typeof isManageEmailAddressDialogOpen !== "boolean" ? isManageEmailAddressDialogOpen : undefined
									}
								/>
							</div>
						</div>
					</div>

					<Separator className="my-4" />

					<div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
						<div>
							<h2 className="text-base font-semibold leading-7 text-foreground">Image</h2>
							{/* <p className="text-sm leading-6 text-muted-foreground">
								You can use any of your verified emails to sign in and your primary email address will be displayed
								throughout the app to other users.
							</p> */}
						</div>
						<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-gray-900/5 md:col-span-2">
							<div className="sm:p-8">
								<div
									{...getRootProps({
										onClick: (e) => {
											e.preventDefault();
										},
									})}
									className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
								>
									<input {...getInputProps()} />
									<Button variant="outline">Choose</Button>
									<p className="mt-1 text-sm text-muted-foreground">JPG and PNG only (max. 4MB) </p>
								</div>
							</div>
						</div>
					</div>

					<Separator className="my-4" />

					<div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
						<div>
							<h2 className="text-base font-semibold leading-7 text-foreground">Change Password</h2>
							<p className="text-sm leading-6 text-muted-foreground">
								This will be used to log into your account and complete high severity actions.
							</p>
						</div>
						<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-gray-900/5 md:col-span-2">
							<div className="sm:p-8">
								<div>
									<FormField
										control={form.control}
										name="currentPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>First Name</FormLabel>
												<FormControl>
													<PasswordInput placeholder="Current Password" {...field} value={field.value ?? ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div>
									<FormField
										control={form.control}
										name="newPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>First Name</FormLabel>
												<FormControl>
													<PasswordInput placeholder="New Password" {...field} value={field.value ?? ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div>
									<FormField
										control={form.control}
										name="newPasswordConfirm"
										render={({ field }) => (
											<FormItem>
												<FormLabel>First Name</FormLabel>
												<FormControl>
													<PasswordInput placeholder="Confirm New Password" {...field} value={field.value ?? ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>
						</div>
					</div>
				</form>
			</Form>
		</>
	);
}

function EmailAddressField({
	index,
	field,
	isPrimary,
	onVerify,
	onDelete,
}: {
	index: number;
	field: AccountSettingsPageFormSchema["emailAddresses"][number];
	isPrimary: boolean;
	onVerify: (emailAddress: EmailAddressResource) => void;
	onDelete: (index: number) => void;
}) {
	const { toast } = useToast();
	const [isDeletingEmailAddressModalOpen, setIsDeletingEmailAddressModalOpen] = React.useState<boolean>(false);
	const [isDeletingEmailAddress, setIsDeletingEmailAddress] = React.useState<boolean>(false);

	if (isPrimary) return <></>;

	return (
		<AccordionItem value={field.emailAddress}>
			<AccordionTrigger>
				<div className="space-x-4">
					<span>{field.emailAddress}</span>
					{field.verification.status !== "verified" && <Badge variant="destructive">Unverified</Badge>}
				</div>
			</AccordionTrigger>
			<AccordionContent>
				<div className="space-y-4">
					{field.verification.status === "verified" ? (
						<div>
							<p className="text-sm font-medium">Make Primary Email Address</p>
							<p className="text-xs text-muted-foreground">
								As your primary email address, this email address will be displayed throughout the app to other users.
								You cannot remove your primary email address.
							</p>
						</div>
					) : (
						<div>
							<p className="text-sm font-medium">Unverified Email Address</p>
							<p className="text-xs text-muted-foreground">
								This email address has not been verified. You will not be able to use it to sign in until you verify it.
								It may also have limited functionality.
							</p>
						</div>
					)}

					<div>
						<p className="text-sm font-medium">Remove</p>
						<p className="text-xs text-muted-foreground">
							If you remove this email address you will no longer be able to use it to sign in.
						</p>

						<AlertDialog open={isDeletingEmailAddressModalOpen} onOpenChange={setIsDeletingEmailAddressModalOpen}>
							<AlertDialogTrigger asChild>
								<Button variant="link" className="-ml-4 text-sm text-destructive">
									Remove this email address
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Are you sure?</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot be undone. This email address will be removed from your account and you will no
										longer be able to use it to sign in.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										variant="destructive"
										disabled={isDeletingEmailAddress}
										onClick={(e) => {
											e.preventDefault();
											setIsDeletingEmailAddress(true);
											field
												.destroy()
												.then(() => {
													toast({
														title: "Removed email address",
														description: "Successfully removed email address from your account.",
													});
													onDelete(index);
												})
												.catch((error) => {
													console.error(error);
													toast({
														title: "Failed to remove email address",
														description: "An error occurred while removing email address. Please try again later.",
													});
												})
												.finally(() => {
													setIsDeletingEmailAddressModalOpen(false);
													setIsDeletingEmailAddress(false);
												});
										}}
									>
										{isDeletingEmailAddress && <Loader className="mr-2" size="sm" />}
										<span>Remove email address</span>
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}
export default withUser(AccountSettingsPage);
