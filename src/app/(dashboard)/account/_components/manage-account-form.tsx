"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { actions } from "~/actions";
import { type ProfileImageUrlGETResponse } from "~/app/api/auth/profile-image-url/route";
import { useUser } from "~/app/providers";
import { type sessions } from "~/db/schema";
import { InsertUserSchema, SelectSessionSchema } from "~/db/validation";
import { AccountDelete } from "./account-delete";
import { AccountDisplayName } from "./account-display-name";
import { AccountEmailAddress } from "./account-email-address";
import { AccountProfileImage } from "./account-profile-image";
import { AccountSessions } from "./account-sessions";
import { AccountVerifyNewEmailAddressDialog } from "./account-verify-new-email-address-dialog";

type Session = typeof sessions.$inferSelect;

const ManageAccountFormSchema = InsertUserSchema.extend({
	sessions: z.array(SelectSessionSchema),
});
type ManageAccountFormSchema = z.infer<typeof ManageAccountFormSchema>;

function ManageAccountForm({ sessions }: { sessions: Array<Session> }) {
	const user = useUser();
	const { toast } = useToast();
	const form = useForm<ManageAccountFormSchema>({
		resolver: zodResolver(ManageAccountFormSchema),
		defaultValues: {
			...user,
			sessions,
		},
	});

	// Have to hold the file here because we need to upload as a File not a url and if you use a File in zod it errors when run on the server as File doesn't exist there
	const [uploadedProfileImage, setUploadedProfileImage] = React.useState<File | null>(null);

	const [verifyNewEmail, setVerifyNewEmail] = React.useState<string | null>(null);

	async function onSubmit(data: ManageAccountFormSchema) {
		try {
			let successfullyUploadedImage = false;
			if (data.profileImageUrl !== user.profileImageUrl) {
				const errorResponse = {
					title: "Failed to upload profile image",
					description: "An unknown error occurred while trying to upload your profile image. Please try again.",
				};
				if (uploadedProfileImage) {
					const response = await fetch(
						`/api/auth/profile-image-url?fileType=${encodeURIComponent(uploadedProfileImage.type)}`,
						{
							method: "GET",
						},
					);

					const body = (await response.json()) as ProfileImageUrlGETResponse;

					if (!body.success || !response.ok) {
						toast(errorResponse);
					} else {
						try {
							const url = body.data;
							const response = await fetch(url, {
								method: "PUT",
								body: uploadedProfileImage,
							});

							if (!response.ok) {
								toast(errorResponse);
							} else {
								function removeQueryParametersFromUrl(url: string) {
									const index = url.indexOf("?");
									if (index !== -1) {
										return url.substring(0, index);
									}
									return url;
								}

								data.profileImageUrl = removeQueryParametersFromUrl(url);
								successfullyUploadedImage = true;
							}
						} catch {
							toast(errorResponse);
						}
					}
				} else {
					if (data.profileImageUrl != null) {
						toast(errorResponse);
					}
				}
			}

			await actions.auth.user.update({
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
				<AccountDisplayName control={form.control} />

				<Separator />

				<AccountEmailAddress control={form.control} />
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

				<AccountSessions control={form.control} />

				<Separator className="hidden sm:flex" />

				<AccountDelete />

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
