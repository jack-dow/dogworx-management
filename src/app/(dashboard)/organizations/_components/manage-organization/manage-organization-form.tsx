"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { type OrganizationById } from "~/actions";
import { generateId } from "~/utils";
import { type ManageOrganizationFormSchema } from "./manage-organization";
import { OrganizationInformation } from "./organization-information";
import { OrganizationInviteLinks } from "./organization-invite-links";

type ManageOrganizationFormProps = {
	open?: never;
	setOpen?: never;
	onSuccessfulSubmit?: never;
	defaultValues?: never;
	withoutTrigger?: never;
	organization?: OrganizationById;
	onSubmit: (data: ManageOrganizationFormSchema) => Promise<{ success: boolean }>;
};

function ManageOrganizationForm({ organization, onSubmit }: ManageOrganizationFormProps) {
	const isNew = !organization;

	const router = useRouter();

	const form = useFormContext<ManageOrganizationFormSchema>();

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	async function handleSubmit(data: ManageOrganizationFormSchema) {
		const result = await onSubmit(data);

		if (result.success) {
			if (isNew) {
				router.replace(`/organizations/${data.id}`);
			} else {
				router.push("/organizations");
			}

			form.setValue("id", generateId());
		}
	}

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

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					void form.handleSubmit(handleSubmit)(e);
				}}
				className="space-y-6 lg:space-y-10"
			>
				<OrganizationInformation control={form.control} variant="form" />

				<Separator className="my-4" />

				<OrganizationInviteLinks
					control={form.control}
					existingInviteLinks={organization?.organizationInviteLinks ?? []}
					variant="form"
				/>

				<Separator className="my-4" />

				<div className="flex justify-end space-x-4">
					<Button
						type="button"
						onClick={() => {
							if (form.formState.isDirty) {
								setIsConfirmNavigationDialogOpen(true);
							} else {
								router.back();
							}
						}}
						variant="outline"
					>
						Back
					</Button>
					<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}>
						{form.formState.isSubmitting && <Loader size="sm" />}
						{isNew ? "Create" : "Update"} organization
					</Button>
				</div>
			</form>
		</>
	);
}

export { type ManageOrganizationFormProps, ManageOrganizationForm };
