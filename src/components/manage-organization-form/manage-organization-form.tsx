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
import { useUser } from "~/app/providers";
import { InsertOrganizationSchema } from "~/db/validation/auth";
import { env } from "~/env.mjs";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { api } from "~/lib/trpc/client";
import { generateId, hasTrueValue, logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";
import { OrganizationGeneralSettings } from "./organization-general-settings";
import { OrganizationInviteLinks } from "./organization-invite-links";
import { OrganizationUsers } from "./organization-users";

const ManageOrganizationFormSchema = InsertOrganizationSchema.extend({
	name: z.string().max(50).nonempty({ message: "Required" }),
});
type ManageOrganizationFormSchema = z.infer<typeof ManageOrganizationFormSchema>;

type ManageOrganizationFormProps = {
	organization?: RouterOutputs["auth"]["organizations"]["byId"]["data"];
};

function ManageOrganizationForm(props: ManageOrganizationFormProps) {
	const isNew = !props.organization;

	const { toast } = useToast();
	const user = useUser();

	const router = useRouter();

	const result = api.auth.organizations.byId.useQuery(
		{ id: props.organization?.id ?? "new" },
		{ initialData: { data: props.organization }, enabled: !isNew },
	);
	const organization = result.data?.data;

	const form = useForm<ManageOrganizationFormSchema>({
		resolver: zodResolver(ManageOrganizationFormSchema),
		defaultValues: {
			maxUsers: 1,
			organizationInviteLinks: [],
			organizationUsers: [],
			...organization,
			id: organization?.id ?? generateId(),
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	const insertMutation = api.auth.organizations.insert.useMutation();
	const updateMutation = api.auth.organizations.update.useMutation();

	React.useEffect(() => {
		if (organization) {
			form.reset(organization, {
				keepDirty: true,
				keepDirtyValues: true,
			});
		}
	}, [organization, form]);

	function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		e.stopPropagation();
		void form.handleSubmit(async (data) => {
			try {
				if (isNew) {
					await insertMutation.mutateAsync(data);
				} else {
					await updateMutation.mutateAsync(data);
				}

				if (user.organizationId === env.NEXT_PUBLIC_ADMIN_ORG_ID) {
					if (isNew) {
						router.replace(`/organizations/${data.id}`);
					} else {
						router.push(`/organizations`);
					}
				} else {
					form.reset(form.getValues());
				}

				toast({
					title: `Organization ${isNew ? "Created" : "Updated"}`,
					description: `Successfully ${isNew ? "created" : "updated"} ${
						user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID ? "your" : ""
					} organization.`,
				});
			} catch (error) {
				logInDevelopment(error);

				toast({
					title: `Organization  ${isNew ? "Creation" : "Update"} Failed`,
					description: `There was an error ${isNew ? "creating" : "updating"} ${
						user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID ? "your" : ""
					} organization. Please try again.`,
					variant: "destructive",
				});
			}
		});
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
				<form onSubmit={onSubmit} className="space-y-6 lg:space-y-10">
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
