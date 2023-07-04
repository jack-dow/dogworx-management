"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { type EmailAddressResource } from "@clerk/types";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

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
import { FormField } from "~/components/ui/form";
import { PlusIcon } from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { type AccountSettingsPageFormSchema } from "../account-settings-page-form";
import { ManageEmailAddressDialog } from "./manage-email-address-dialog";

function EmailAddresses({ control }: { control: Control<AccountSettingsPageFormSchema> }) {
	const { user } = useUser();

	const [isManageEmailAddressDialogOpen, setIsManageEmailAddressDialogOpen] = React.useState<
		EmailAddressResource | boolean
	>(false);

	const { setValue, watch } = useFormContext();

	const emailAddresses = useFieldArray({
		control: control,
		name: "emailAddresses",
		keyName: "rhf-id",
	});

	if (!user) return null;

	return (
		<div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Email Addresses</h2>
				<p className="text-sm leading-6 text-muted-foreground">
					You can use any of your verified emails to sign in and your primary email address will be displayed throughout
					the app to other users.
				</p>
			</div>
			<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 md:col-span-2">
				<div className="space-y-4 sm:p-8">
					<Accordion type="single" collapsible className="w-full">
						<FormField
							control={control}
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
															As your primary email address, this email address will be displayed throughout the app to
															other users.
														</p>
													</div>
												) : (
													<div>
														<p className="text-sm font-medium">Unverified Email Address</p>
														<p className="text-xs text-muted-foreground">
															This email address has not been verified. You will not be able to use it to sign in until
															you verify it. It may also have limited functionality.
														</p>
														<Button
															variant="link"
															className="-ml-4"
															onClick={() => {
																if (user.primaryEmailAddress) {
																	setIsManageEmailAddressDialogOpen(user.primaryEmailAddress);
																}
															}}
														>
															Verify this email address
														</Button>
													</div>
												)}
												<div>
													<p className="text-sm font-medium">Remove</p>
													<p className="text-xs text-muted-foreground">
														You cannot remove your primary email address. If you want to remove it, you must first set
														another email address as your primary email address.
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
								isPrimary={watch("primaryEmailAddressId") === field.id}
								onVerify={() => {
									if (user.emailAddresses && user.emailAddresses[index]) {
										// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
										setIsManageEmailAddressDialogOpen(user.emailAddresses[index]!);
									}
								}}
								onDelete={(index) => {
									emailAddresses.remove(index);
								}}
								updatePrimaryEmailAddress={async (emailAddress) => {
									try {
										const result = await user.update({
											primaryEmailAddressId: emailAddress.id,
										});
										if (result.primaryEmailAddressId === emailAddress.id) {
											setValue("primaryEmailAddressId", emailAddress.id);
											setValue("primaryEmailAddress", emailAddress);
										}
									} catch (error) {}
								}}
							/>
						))}
					</Accordion>

					<Button
						type="button"
						variant="ghost"
						className="-ml-4"
						onClick={() => {
							setIsManageEmailAddressDialogOpen(true);
						}}
					>
						<PlusIcon className="mr-2 h-4 w-4" /> Add another email address
					</Button>

					<ManageEmailAddressDialog
						open={!!isManageEmailAddressDialogOpen}
						setOpen={setIsManageEmailAddressDialogOpen}
						emailAddress={
							typeof isManageEmailAddressDialogOpen !== "boolean" ? isManageEmailAddressDialogOpen : undefined
						}
						onAddEmailAddress={(emailAddress) => {
							emailAddresses.append(emailAddress);
						}}
						onSuccessfulVerification={(emailAddress) => {
							if (user.primaryEmailAddress?.id === emailAddress.id) {
								setValue("primaryEmailAddress", emailAddress);
							} else {
								const field = emailAddresses.fields.findIndex((field) => field.id === emailAddress.id);
								if (field) {
									emailAddresses.update(field, emailAddress);
								}
							}
						}}
					/>
				</div>
			</div>
		</div>
	);
}

function EmailAddressField({
	index,
	field,
	isPrimary,
	updatePrimaryEmailAddress,
	onVerify,
	onDelete,
}: {
	index: number;
	field: AccountSettingsPageFormSchema["emailAddresses"][number];
	isPrimary: boolean;
	updatePrimaryEmailAddress: (emailAddress: AccountSettingsPageFormSchema["emailAddresses"][number]) => Promise<void>;
	onVerify: () => void;
	onDelete: (index: number) => void;
}) {
	const { toast } = useToast();
	const [isDeletingEmailAddressModalOpen, setIsDeletingEmailAddressModalOpen] = React.useState<boolean>(false);
	const [isDeletingEmailAddress, setIsDeletingEmailAddress] = React.useState<boolean>(false);

	const [isUpdatingPrimaryEmailAddress, setIsUpdatingPrimaryEmailAddress] = React.useState<boolean>(false);

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
							<Button
								variant="link"
								className="-ml-4"
								disabled={isUpdatingPrimaryEmailAddress}
								onClick={() => {
									setIsUpdatingPrimaryEmailAddress(true);
									updatePrimaryEmailAddress(field)
										.then(() => {
											toast({
												title: "Primary Email Address Updated",
												description: `Your primary email address has been updated to "${field.emailAddress}".`,
											});
										})
										.catch(() => {
											toast({
												title: "Failed to Update Primary Email Address",
												description: `Your primary email address could not be updated to "${field.emailAddress}". Please try again later.`,
											});
										})
										.finally(() => {
											setIsUpdatingPrimaryEmailAddress(false);
										});
								}}
							>
								Set as primary email address
							</Button>
						</div>
					) : (
						<div>
							<p className="text-sm font-medium">Unverified Email Address</p>
							<p className="text-xs text-muted-foreground">
								This email address has not been verified. You will not be able to use it to sign in until you verify it.
								It may also have limited functionality.
							</p>
							<Button variant="link" className="-ml-4" onClick={onVerify}>
								Verify this email address
							</Button>
						</div>
					)}

					<div>
						<p className="text-sm font-medium">Remove</p>
						<p className="text-xs text-muted-foreground">
							If you remove this email address you will no longer be able to use it to sign in.
						</p>

						<AlertDialog open={isDeletingEmailAddressModalOpen} onOpenChange={setIsDeletingEmailAddressModalOpen}>
							<AlertDialogTrigger asChild>
								<Button variant="link" className="-ml-4 text-destructive">
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
													setIsDeletingEmailAddressModalOpen(false);
												})
												.catch((error) => {
													console.error(error);
													toast({
														title: "Failed to remove email address",
														description: "An error occurred while removing email address. Please try again later.",
													});
												})
												.finally(() => {
													setIsDeletingEmailAddress(false);
												});
										}}
									>
										{isDeletingEmailAddress && <Loader size="sm" />}
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

export { EmailAddresses };
