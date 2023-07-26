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
import { ChangePassword } from "./change-password";
import { ConnectedAccounts } from "./connected-accounts";
import { DeleteAccount } from "./delete-account";
import { DisplayName } from "./display-name";
import { EmailAddresses } from "./email-addresses";
import { ProfileImage } from "./profile-image";
import { Sessions } from "./sessions";

// const ClerkEmailAddressSchema = z.object({
// 	id: z.string(),
// 	emailAddress: z.string().email(),
// 	verification: z.object({
// 		status: z.enum(["unverified", "verified", "transferable", "failed", "expired"]).nullish(),
// 	}),
// 	destroy: z.function().returns(z.promise(z.void())),
// });

// const ClerkSessionWithActivitiesSchema = z.object({
// 	id: z.string(),
// 	status: z.string(),
// 	lastActiveAt: z.date(),
// 	latestActivity: z.object({
// 		id: z.string(),
// 		browserName: z.string().optional(),
// 		browserVersion: z.string().optional(),
// 		deviceType: z.string().optional(),
// 		ipAddress: z.string().optional(),
// 		city: z.string().optional(),
// 		country: z.string().optional(),
// 		isMobile: z.boolean().optional(),
// 	}),
// 	revoke: z.function().returns(z.promise(z.any())),
// });

const PasswordChangeSchema = z
	.object({
		currentPassword: z.string().min(8).max(100).nullish(),
		newPassword: z.string().min(8).max(100).nullish(),
		newPasswordConfirm: z.string().min(8).max(100).nullish(),
		signOutOtherSessions: z.boolean().default(true),
	})
	.superRefine((val, ctx) => {
		if ((val.newPassword || val.newPasswordConfirm) && !val.currentPassword) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Required",
				path: ["currentPassword"],
			});
		}

		if (val.newPasswordConfirm && !val.newPassword) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Required",
				path: ["newPassword"],
			});
		}

		if (val.newPassword !== val.newPasswordConfirm) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Passwords do not match",
				path: ["newPasswordConfirm"],
			});
		}
	});

const AccountSettingsPageFormSchema = z.intersection(
	z.object({
		givenName: z.string().max(50).nonempty({ message: "Required" }),
		familyName: z.string().max(50).or(z.literal("")).optional(),
		primaryEmailAddressId: z.string().optional(),
		primaryEmailAddress: ClerkEmailAddressSchema.optional(),
		emailAddresses: z.array(ClerkEmailAddressSchema),
		profileImageUrl: z.string().url().optional(),
		externalAccounts: z.array(
			z.object({
				id: z.string(),
				provider: z.string(),
				firstName: z.string(),
				lastName: z.string(),
				emailAddress: z.string(),
				avatarUrl: z.string(),
				imageUrl: z.string().nullish(),
				verification: z
					.object({
						status: z.enum(["unverified", "verified", "transferable", "failed", "expired"]).nullish(),
					})
					.nullish(),
				destroy: z.function().returns(z.promise(z.void())),
				reauthorize: z.function().returns(z.promise(z.void())),
			}),
		),
		sessions: z.array(ClerkSessionWithActivitiesSchema),
	}),
	PasswordChangeSchema,
);
type ManageAccountFormSchema = z.infer<typeof AccountSettingsPageFormSchema>;

function ManageAccountForm() {
	const { toast } = useToast();
	const form = useForm<ManageAccountFormSchema>({
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

	if (Object.keys(form.formState.errors).length > 0) {
		console.log(form.formState.errors);
	}

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

	async function onSubmit(data: ManageAccountFormSchema) {
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

const AccountSettingsPageForm = withUser(ManageAccountForm);

export { AccountSettingsPageForm, ManageAccountFormSchema };
