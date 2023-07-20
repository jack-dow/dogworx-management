"use client";

import * as React from "react";
import Image from "next/image";
import { useFieldArray, type Control } from "react-hook-form";

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
import { Button } from "~/components/ui/button";
import { AppleIcon, GoogleIcon } from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { type AccountSettingsPageFormSchema } from "../account-settings-page-form";
import { AddConnectedAccountDialog } from "./add-connected-account-dialog";

function ConnectedAccounts({ control }: { control: Control<AccountSettingsPageFormSchema> }) {
	const externalAccounts = useFieldArray({
		control: control,
		name: "externalAccounts",
		keyName: "rhf-id",
	});

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Connected accounts</h2>
				<p className="text-sm leading-6 text-muted-foreground">
					These are the external accounts that you have connected to your account.
				</p>
			</div>
			<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 md:col-span-2">
				<div className="space-y-4 sm:p-8">
					{externalAccounts.fields.length > 0 && (
						<Accordion type="single" collapsible className="w-full">
							{externalAccounts.fields.map((field, index) => (
								<ConnectedAccountField
									key={field.id}
									index={index}
									field={field}
									onDelete={(index) => {
										externalAccounts.remove(index);
									}}
								/>
							))}
						</Accordion>
					)}

					<AddConnectedAccountDialog />
				</div>
			</div>
		</div>
	);
}

function ConnectedAccountField({
	index,
	field,
	onDelete,
}: {
	index: number;
	field: AccountSettingsPageFormSchema["externalAccounts"][number];
	onDelete: (index: number) => void;
}) {
	const { toast } = useToast();
	const [isDeletingConnectionModalOpen, setIsDeletingConnectionModalOpen] = React.useState<boolean>(false);
	const [isDeletingConnection, setIsDeletingConnection] = React.useState<boolean>(false);

	if (field.verification?.status !== "verified") return null;

	return (
		<AccordionItem value={field.emailAddress} key={field.id}>
			<AccordionTrigger>
				<div className="flex items-center justify-center space-x-4">
					{field.provider === "google" && <GoogleIcon className="mr-2 h-4 w-4" />}
					{field.provider === "apple" && <AppleIcon className="mr-2 h-4 w-4" />}
					<span>
						{field.provider.charAt(0).toUpperCase() + field.provider.slice(1)} ({field.emailAddress})
					</span>
				</div>
			</AccordionTrigger>
			<AccordionContent>
				<div className="space-y-4">
					<div className="flex items-center space-x-4">
						<div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-gray-100">
							{(field.avatarUrl || field.imageUrl) && (
								<Image
									src={field.avatarUrl ?? field.imageUrl}
									alt={`User's ${field.provider.charAt(0).toUpperCase() + field.provider.slice(1)} profile image`}
									width={256}
									height={256}
									className="aspect-square rounded-md object-cover"
								/>
							)}
						</div>
						<div>
							<p className="text-sm font-medium">
								{field.firstName} {field.lastName}
							</p>
							<p className="text-xs text-muted-foreground">{field.emailAddress}</p>
						</div>
					</div>

					<div>
						<p className="text-sm font-medium">Remove</p>
						<p className="text-xs text-muted-foreground">
							If you remove this connection you will no longer be able to use it to sign in.
						</p>

						<AlertDialog open={isDeletingConnectionModalOpen} onOpenChange={setIsDeletingConnectionModalOpen}>
							<AlertDialogTrigger asChild>
								<Button variant="link" className="-ml-4 text-destructive">
									Remove connected account
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Are you sure?</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot be undone. This connected account will be removed from your account and you will
										no longer be able to use it to sign in.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										variant="destructive"
										disabled={isDeletingConnection}
										onClick={(e) => {
											e.preventDefault();
											setIsDeletingConnection(true);
											field
												.destroy()
												.then(() => {
													toast({
														title: `Removed connection `,
														description: `Successfully removed connection with "${
															field.provider.charAt(0).toUpperCase() + field.provider.slice(1)
														}" from your account.`,
													});
													onDelete(index);
												})
												.catch((error) => {
													console.log(error);
													toast({
														title: "Failed to remove connection",
														description:
															"An error occurred while trying to remove the connected account. Please try again later.",
													});
												})
												.finally(() => {
													setIsDeletingConnectionModalOpen(false);
													setIsDeletingConnection(false);
												});
										}}
									>
										{isDeletingConnection && <Loader size="sm" />}
										<span>Remove connected account</span>
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

export { ConnectedAccounts };
