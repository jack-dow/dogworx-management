"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { useUser } from "~/app/dashboard/providers";
import { InsertUserSchema } from "~/db/validation";
import { AccountDelete } from "./account-delete";
import { AccountDisplayName } from "./account-display-name";
import { AccountEmailAddress } from "./account-email-address";
import { AccountProfileImage } from "./account-profile-image";
import { AccountSessions } from "./account-sessions";

const ManageAccountFormSchema = InsertUserSchema;
type ManageAccountFormSchema = z.infer<typeof ManageAccountFormSchema>;

function ManageAccountForm() {
	const user = useUser();
	const { toast } = useToast();
	const form = useForm<ManageAccountFormSchema>({
		resolver: zodResolver(ManageAccountFormSchema),
		defaultValues: {
			...user,
		},
	});

	if (Object.keys(form.formState.errors).length > 0) {
		console.log(form.formState.errors);
	}

	// Have to hold the file here because Clerk only supports uploading a File object not a url and if you use a File in zod it errors when run on the server as File doesn't exist there
	const [uploadedProfileImage, setUploadedProfileImage] = React.useState<File | null>(null);

	async function onSubmit(data: ManageAccountFormSchema) {
		try {
			// await user.update({
			// 	firstName: data.givenName,
			// 	lastName: data.familyName,
			// });

			// if (data.profileImageUrl !== user.profileImageUrl) {
			// 	await user.setProfileImage({ file: uploadedProfileImage });
			// }

			// if (data.newPassword) {
			// 	await user.updatePassword({
			// 		currentPassword: user.passwordEnabled ? data.currentPassword ?? undefined : undefined,
			// 		newPassword: data.newPassword,
			// 		signOutOfOtherSessions: data.signOutOtherSessions,
			// 	});
			// }

			toast({
				title: "Account updated",
				description: "Your account has been updated successfully.",
			});
		} catch (error) {
			toast({
				title: "Failed to update account",
				description: "Something went wrong while updating your account. Please try again later.",
			});
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)} className="space-y-10 ">
				<AccountDisplayName control={form.control} />

				<Separator className="my-4" />

				<AccountEmailAddress control={form.control} />

				<Separator className="my-4" />

				<AccountProfileImage
					setUploadedProfileImage={(file) => {
						setUploadedProfileImage(file);
					}}
				/>

				<Separator className="my-4" />

				<AccountSessions control={form.control} />

				<Separator className="my-4" />

				<AccountDelete />

				<Separator className="my-8" />

				<div className="flex justify-end">
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting && <Loader size="sm" />}
						Save changes
					</Button>
				</div>
			</form>
		</Form>
	);
}

export { ManageAccountForm, ManageAccountFormSchema };
