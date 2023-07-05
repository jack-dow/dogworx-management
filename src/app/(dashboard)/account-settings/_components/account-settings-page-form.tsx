"use client";

import * as React from "react";
import { isClerkAPIResponseError, withUser, type WithUserProp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { prettyStringValidationMessage } from "~/lib/validations/utils";
import { ChangePassword } from "./change-password";
import { ConnectedAccounts } from "./connected-accounts";
import { DeleteAccount } from "./delete-account";
import { DisplayName } from "./display-name";
import { EmailAddresses } from "./email-addresses";
import { ProfileImage } from "./profile-image";
import { Sessions } from "./sessions";

const EmailAddressSchema = z.object({
	id: z.string(),
	emailAddress: z.string().email(),
	verification: z.object({
		status: z.enum(["unverified", "verified", "transferable", "failed", "expired"]).nullish(),
	}),
	destroy: z.function().returns(z.promise(z.void())),
});

const SessionWithActivitiesSchema = z.object({
	id: z.string(),
	status: z.string(),
	lastActiveAt: z.date(),
	latestActivity: z.object({
		id: z.string(),
		browserName: z.string().optional(),
		browserVersion: z.string().optional(),
		deviceType: z.string().optional(),
		ipAddress: z.string().optional(),
		city: z.string().optional(),
		country: z.string().optional(),
		isMobile: z.boolean().optional(),
	}),
	revoke: z.function().returns(z.promise(z.any())),
});

const AccountSettingsPageFormSchema = z.object({
	givenName: prettyStringValidationMessage("First Name", 2, 50),
	familyName: prettyStringValidationMessage("Last name", 0, 50).optional(),
	primaryEmailAddressId: z.string().optional(),
	primaryEmailAddress: EmailAddressSchema.optional(),
	emailAddresses: z.array(EmailAddressSchema),
	profileImageUrl: z.string().url().optional(),
	currentPassword: prettyStringValidationMessage("Your current password", 8, 100).nullish(),
	newPassword: prettyStringValidationMessage("Your new password", 8, 100).nullish(),
	newPasswordConfirm: prettyStringValidationMessage("Your new password", 8, 100).nullish(),
	signOutOtherSessions: z.boolean().default(true),
	externalAccounts: z.array(
		z.object({
			id: z.string(),
			provider: z.string(),
			firstName: z.string(),
			lastName: z.string(),
			emailAddress: z.string().email(),
			avatarUrl: z.string().url(),
			imageUrl: z.string().url(),
			verification: z
				.object({
					status: z.enum(["unverified", "verified", "transferable", "failed", "expired"]).nullish(),
				})
				.nullish(),
			destroy: z.function().returns(z.promise(z.void())),
			reauthorize: z.function().returns(z.promise(z.void())),
		}),
	),
	sessions: z.array(SessionWithActivitiesSchema),
});
type AccountSettingsPageFormSchema = z.infer<typeof AccountSettingsPageFormSchema>;

function AccountSettingsPageFormRoot({ user }: WithUserProp) {
	const { toast } = useToast();
	const form = useForm<AccountSettingsPageFormSchema>({
		resolver: zodResolver(AccountSettingsPageFormSchema),
		defaultValues: {
			givenName: user.firstName ?? "",
			familyName: user.lastName ?? "",
			primaryEmailAddressId: user.primaryEmailAddressId ?? "",
			primaryEmailAddress: user.primaryEmailAddress ?? undefined,
			emailAddresses: user.emailAddresses ?? [],
			profileImageUrl: user.profileImageUrl,
			signOutOtherSessions: true,
			externalAccounts: user.externalAccounts ?? [],
		},
	});
	// Have to hold the file here because Clerk only supports uploading a File object not a url and if you use a File in zod it errors when run on the server as File doesn't exist there
	const [uploadedProfileImage, setUploadedProfileImage] = React.useState<File | null>(null);

	React.useEffect(() => {
		user
			.getSessions()
			.then((sessions) => {
				form.setValue("sessions", sessions);
			})
			.catch((error) => {
				console.log("Failed to fetch sessions", error);
			});
	}, [user, form]);

	async function onSubmit(data: AccountSettingsPageFormSchema) {
		console.log(data);

		if (data.newPassword && !data.currentPassword) {
			form.setError("currentPassword", {
				type: "manual",
				message: "Please enter your current password",
			});
			toast({
				title: "Failed to update account",
				description: "Please enter your current password.",
			});
			return;
		}

		if (data.newPassword && data.newPassword !== data.newPasswordConfirm) {
			form.setError("newPasswordConfirm", {
				type: "manual",
				message: "Passwords do not match",
			});
			toast({
				title: "Failed to update account",
				description: "Passwords do not match.",
			});
			return;
		}

		try {
			await user.update({
				firstName: data.givenName,
				lastName: data.familyName,
			});

			if (data.profileImageUrl !== user.profileImageUrl) {
				await user.setProfileImage({ file: uploadedProfileImage });
			}

			if (data.newPassword) {
				await user.updatePassword({
					currentPassword: user.passwordEnabled ? data.currentPassword ?? undefined : undefined,
					newPassword: data.newPassword,
					signOutOfOtherSessions: data.signOutOtherSessions,
				});
			}

			toast({
				title: "Account updated",
				description: "Your account has been updated successfully.",
			});
		} catch (error) {
			let hasError = false;
			if (isClerkAPIResponseError(error)) {
				console.log(error.errors);
				error.errors.forEach((error) => {
					if (error.code === "form_password_pwned") {
						form.setError("newPassword", {
							type: "manual",
							message: error.message,
						});
						toast({
							title: "Failed to update account",
							description: error.message,
						});
						hasError = true;
					}

					if (error.code === "form_password_validation_failed") {
						form.setError("currentPassword", {
							type: "manual",
							message: "Your current password is incorrect. Please try again.",
						});
						toast({
							title: "Failed to update account",
							description: "Your current password is incorrect. Please try again.",
						});
						hasError = true;
					}
				});
			}

			if (!hasError) {
				toast({
					title: "Failed to update account",
					description: "Something went wrong while updating your account. Please try again later.",
				});
			}
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)} className="space-y-10 ">
				<DisplayName control={form.control} />

				<Separator className="my-4" />

				<EmailAddresses control={form.control} />

				<Separator className="my-4" />

				<ConnectedAccounts control={form.control} />

				<Separator className="my-4" />

				<ProfileImage
					setUploadedProfileImage={(file) => {
						setUploadedProfileImage(file);
					}}
				/>

				<Separator className="my-4" />

				<ChangePassword control={form.control} />

				<Separator className="my-4" />

				<Sessions control={form.control} />

				{user.deleteSelfEnabled && (
					<>
						<Separator className="my-4" />

						<DeleteAccount />
					</>
				)}

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

const AccountSettingsPageForm = withUser(AccountSettingsPageFormRoot);

export { AccountSettingsPageForm, AccountSettingsPageFormSchema };
