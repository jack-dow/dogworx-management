"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Form } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { actions, type OrganizationById } from "~/actions";
import { useUser } from "~/app/providers";
import { InsertOrganizationInviteLinkSchema, InsertOrganizationSchema, SelectUserSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { hasTrueValue } from "~/utils";
import { OrganizationSettings } from "./organization-settings";
import {OrganizationInviteLinks} from "./organization-invite-links";

const OrganizationUserSchema = SelectUserSchema.pick({
	id: true,
	givenName: true,
	familyName: true,
	emailAddress: true,
	organizationRole: true,
	profileImageUrl: true,
});

const OrganizationSettingsFormSchema = InsertOrganizationSchema.extend({
	name: z.string().max(50).nonempty({ message: "Required" }),
	organizationInviteLinks: z.array(
		InsertOrganizationInviteLinkSchema.extend({
			user: OrganizationUserSchema,
		}),
	),
	users: z.array(OrganizationUserSchema),
});
type OrganizationSettingsFormSchema = z.infer<typeof OrganizationSettingsFormSchema>;

type ManageOrganizationFormProps = {
	organization: OrganizationById;
};

function OrganizationSettingsForm({ organization }: ManageOrganizationFormProps) {
	const user = useUser();

	const router = useRouter();

	const { toast } = useToast();

	const form = useForm<OrganizationSettingsFormSchema>({
		resolver: zodResolver(OrganizationSettingsFormSchema),
		defaultValues: {
			...organization,
			actions: {
				organizationInviteLinks: {},
				users: {},
			},
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	React.useEffect(() => {
		function syncOrganization(organization: OrganizationById) {
			const actions = form.getValues("actions");
			form.reset(
				{ ...organization, actions },
				{
					keepDirty: true,
					keepDirtyValues: true,
				},
			);
		}

		if (organization) {
			syncOrganization(organization);
		}
	}, [organization, form, toast]);

	async function onSubmit(data: OrganizationSettingsFormSchema) {
		let success = false;

		const response = await actions.auth.organizations.update(data);
		success = response.success && !!response.data;

		if (success) {
			toast({
				title: `Organization Updated`,
				description: `Successfully updated your organization.`,
			});
		} else {
			toast({
				title: `Organization Update Failed`,
				description: `There was an error updating your organization. Please try again.`,
				variant: "destructive",
			});
		}
	}

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	return (
		<>
			<ConfirmFormNavigationDialog
				open={isConfirmNavigationDialogOpen}
				onOpenChange={() => {
					setIsConfirmNavigationDialogOpen(false);
				}}
				onConfirm={() => {
					router.back();
				}}
			/>

			<Form {...form}>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit(async (data) => {
							await onSubmit(data);
						})(e);
					}}
					className="space-y-6 lg:space-y-10"
				>
					<OrganizationSettings />

					<Separator />

					<OrganizationInviteLinks existingInviteLinks={organization?.organizationInviteLinks ?? []} />

					{/* <Separator /> */}

					{/* <OrganizationUsers variant="form" existingUsers={organization?.users ?? []} /> */}

					{/* <Separator /> */}

					<div className="flex justify-end space-x-4">
						<Button
							type="button"
							onClick={() => {
								if (isFormDirty) {
									setIsConfirmNavigationDialogOpen(true);
								} else {
									router.back();
								}
							}}
							variant="outline"
						>
							Back
						</Button>
						<Button
							type="submit"
							disabled={
								form.formState.isSubmitting ||
								!isFormDirty ||
								(user.organizationRole !== "owner" && user.organizationRole !== "admin")
							}
							onClick={() => {
								const numOfErrors = Object.keys(form.formState.errors).length;
								if (numOfErrors > 0) {
									toast({
										title: `Form submission errors`,
										description: `There ${numOfErrors === 1 ? "is" : "are"} ${numOfErrors} error${
											numOfErrors > 1 ? "s" : ""
										} with your submission. Please fix them and resubmit.`,
										variant: "destructive",
									});
								}
							}}
						>
							{form.formState.isSubmitting && <Loader size="sm" />}
							Save changes
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
}

export { OrganizationSettingsForm, OrganizationSettingsFormSchema };
