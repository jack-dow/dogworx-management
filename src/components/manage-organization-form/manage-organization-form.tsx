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
import {
	InsertOrganizationInviteLinkSchema,
	InsertOrganizationSchema,
	SelectSessionSchema,
	SelectUserSchema,
} from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { generateId, hasTrueValue } from "~/utils";
import { OrganizationGeneralSettings } from "./organization-general-settings";
import { OrganizationInviteLinks } from "./organization-invite-links";
import { OrganizationUsers } from "./organization-users";

const OrganizationUserSchema = SelectUserSchema.omit({
	createdAt: true,
	updatedAt: true,
	bannedAt: true,
	bannedUntil: true,
});

const ManageOrganizationFormSchema = InsertOrganizationSchema.extend({
	name: z.string().max(50).nonempty({ message: "Required" }),
	organizationInviteLinks: z.array(
		InsertOrganizationInviteLinkSchema.extend({
			userId: z.string().nullable(),
			user: OrganizationUserSchema.nullable(),
		}),
	),
	users: z.array(
		OrganizationUserSchema.extend({
			sessions: z.array(
				SelectSessionSchema.pick({
					id: true,
					lastActiveAt: true,
				}),
			),
		}),
	),
});
type ManageOrganizationFormSchema = z.infer<typeof ManageOrganizationFormSchema>;

type ManageOrganizationFormProps = {
	organization?: OrganizationById;
};

function ManageOrganizationForm({ organization }: ManageOrganizationFormProps) {
	const isNew = !organization;

	const user = useUser();

	const router = useRouter();

	const { toast } = useToast();

	const form = useForm<ManageOrganizationFormSchema>({
		resolver: zodResolver(ManageOrganizationFormSchema),
		defaultValues: {
			maxUsers: 1,
			...organization,
			id: organization?.id ?? generateId(),
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

	async function onSubmit(data: ManageOrganizationFormSchema) {
		let success = false;

		if (isNew) {
			const response = await actions.auth.organizations.insert(data);
			success = response.success && !!response.data;
		} else {
			const response = await actions.auth.organizations.update(data);
			success = response.success && !!response.data;
		}

		if (success) {
			if (user.organizationId === "1") {
				if (isNew) {
					router.replace(`/organization/${data.id}`);
				} else {
					router.push(`/organizations`);
				}
			} else {
				form.reset(form.getValues());
			}
			toast({
				title: `Organization ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "create" : "updated"} your organization.`,
			});
		} else {
			toast({
				title: `Organization  ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} your organization. Please try again.`,
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
					<OrganizationGeneralSettings />

					<Separator />

					<OrganizationInviteLinks isNew={isNew} />

					<Separator />

					<OrganizationUsers isNew={isNew} />

					<Separator />

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
								console.log(form.getValues());
								console.log(form.formState.errors);

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

export { ManageOrganizationForm, ManageOrganizationFormSchema };
