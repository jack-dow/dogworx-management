"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { type ProfileImageUrlGETResponse } from "~/app/api/auth/profile-image-url/route";
import { useUser } from "~/app/providers";
import { InsertUserSchema } from "~/db/validation/auth";
import { logInDevelopment } from "~/lib/client-utils";
import { api } from "~/lib/trpc/client";
import { type RouterOutputs } from "~/server";
import { AccountProfileImage } from "./account-profile-image";
import { AccountSessions } from "./account-sessions";
import { AccountVerifyNewEmailAddressDialog } from "./account-verify-new-email-address-dialog";

const ManageAccountFormSchema = InsertUserSchema;
type ManageAccountFormSchema = z.infer<typeof ManageAccountFormSchema>;

export async function handleProfileImageUpload(file: File) {
	const getUrlResponse = await fetch(`/api/auth/profile-image-url?fileType=${encodeURIComponent(file.type)}`, {
		method: "GET",
	});

	const body = (await getUrlResponse.json()) as ProfileImageUrlGETResponse;

	if (!body.success || !getUrlResponse.ok) {
		throw new Error("Failed to upload profile image");
	}

	const url = body.data;
	const uploadResponse = await fetch(url, {
		method: "PUT",
		body: file,
	});

	if (!uploadResponse.ok) {
		throw new Error("Failed to upload profile image");
	}

	const index = url.indexOf("?");
	if (index !== -1) {
		return url.substring(0, index);
	}
	return url;
}

function ManageAccountForm({ initialSessions }: { initialSessions: RouterOutputs["auth"]["user"]["sessions"]["all"] }) {
	const user = useUser();
	const { toast } = useToast();
	const router = useRouter();
	const form = useForm<ManageAccountFormSchema>({
		resolver: zodResolver(ManageAccountFormSchema),
		defaultValues: user,
	});

	// Have to hold the file here because we need to upload as a File not a url and if you use a File in zod it errors when run on the server as File doesn't exist there
	const [uploadedProfileImage, setUploadedProfileImage] = React.useState<File | null>(null);

	const [verifyNewEmail, setVerifyNewEmail] = React.useState<string | null>(null);

	const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

	const accountUpdateMutation = api.auth.user.update.useMutation({});
	const accountDeleteMutation = api.auth.user.delete.useMutation({});

	async function onSubmit(data: ManageAccountFormSchema) {
		try {
			let successfullyUploadedImage = false;

			// If the profile image has changed, upload it
			if (data.profileImageUrl !== user.profileImageUrl) {
				if (uploadedProfileImage) {
					handleProfileImageUpload(uploadedProfileImage)
						.then((url) => {
							data.profileImageUrl = url;
							successfullyUploadedImage = true;
						})
						.catch(() => {
							toast({
								title: "Failed to upload profile image",
								description: "An unknown error occurred while trying to upload your profile image. Please try again.",
							});
						});
				}
			}

			await accountUpdateMutation.mutateAsync({
				...data,
				emailAddress: user.emailAddress,
				profileImageUrl:
					data.profileImageUrl != null
						? successfullyUploadedImage
							? data.profileImageUrl
							: user.profileImageUrl
						: null,
			});

			if (data.emailAddress !== user.emailAddress) {
				setVerifyNewEmail(data.emailAddress);
			}

			toast({
				title: "Account updated",
				description: "Your account has been updated successfully.",
			});

			form.reset(data);
		} catch (error) {
			toast({
				title: "Failed to update account",
				description: "Something went wrong while updating your account. Please try again.",
				variant: "destructive",
			});
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
				className="space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12"
			>
				<div className="grid grid-cols-1 gap-2 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
					<div>
						<h2 className="text-base font-semibold leading-7 text-foreground">Display name</h2>
						<p className="text-sm leading-6 text-muted-foreground">This will be displayed publicly as your name.</p>
					</div>

					<div className="flex flex-col gap-2 xl:col-span-2 xl:flex-row xl:gap-4">
						<div className="flex w-full flex-1">
							<FormField
								control={form.control}
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
								control={form.control}
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

				<Separator />

				<div className="grid grid-cols-1 gap-2 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
					<div>
						<h2 className="text-base font-semibold leading-7 text-foreground">Email address</h2>
						<p className="text-sm leading-6 text-muted-foreground">
							This will be used to sign in, provide reports and receipts, and send you notifications.
						</p>
					</div>

					<div className="xl:col-span-2">
						<FormField
							control={form.control}
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
				<AccountVerifyNewEmailAddressDialog
					emailAddress={verifyNewEmail}
					open={!!verifyNewEmail}
					setOpen={(open) => {
						if (!open) {
							setVerifyNewEmail(null);
						}
					}}
				/>

				<Separator />

				<AccountProfileImage
					setUploadedProfileImage={(file) => {
						setUploadedProfileImage(file);
					}}
				/>

				<Separator />

				<AccountSessions initialSessions={initialSessions} />

				<Separator className="hidden sm:flex" />

				<div className="grid grid-cols-1 items-center gap-2 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
					<div>
						<h2 className="text-base font-semibold leading-7 text-foreground">Delete account</h2>
						<p className="text-sm leading-6 text-muted-foreground">
							Once you delete your account, there is no going back. All data associated with your account will be
							permanently deleted.
						</p>
					</div>
					<div className="flex flex-col space-y-4 xl:col-span-2">
						{user.organizationRole === "owner" && (
							<div className="shrink-0 text-sm">
								Your account is currently the owner of the organization. You must transfer ownership of the organization
								to another user before you can delete your account.
							</div>
						)}
						<div>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button disabled={user.organizationRole === "owner"} variant="destructive">
										Delete your account
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent className="sm:max-w-[425px]">
									<AlertDialogHeader>
										<AlertDialogTitle>Are you sure?</AlertDialogTitle>
										<AlertDialogDescription>
											Once you delete your account, it and all associated data will be permanently deleted.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											variant="destructive"
											disabled={isDeletingAccount}
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												setIsDeletingAccount(true);

												accountDeleteMutation
													.mutateAsync()
													.then(() => {
														toast({
															title: "Account deleted",
															description: "Your account was successfully deleted.",
														});
														void router.push("/sign-in");
													})
													.catch((error) => {
														logInDevelopment(error);

														toast({
															title: "Something went wrong",
															description:
																"An unknown error ocurred and we were unable to delete your account. Please try again.",
															variant: "destructive",
														});
													})
													.finally(() => {
														setIsDeletingAccount(false);
													});
											}}
										>
											{isDeletingAccount && <Loader size="sm" />}
											<span>Delete account</span>
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
				</div>

				<Separator className="my-8" />

				<div className="flex justify-end">
					<Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
						{form.formState.isSubmitting && <Loader size="sm" />}
						Save changes
					</Button>
				</div>
			</form>
		</Form>
	);
}

export { ManageAccountForm, ManageAccountFormSchema };
