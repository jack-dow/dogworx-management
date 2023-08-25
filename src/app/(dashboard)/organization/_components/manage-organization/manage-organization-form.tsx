"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { type OrganizationById } from "~/actions";
import { useUser } from "~/app/(dashboard)/providers";
import { generateId, hasTrueValue } from "~/utils";
import { type ManageOrganizationFormSchema } from "./manage-organization";
import { OrganizationDeleteDialog } from "./organization-delete-dialog";
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

	const { toast } = useToast();

	const user = useUser();
	const router = useRouter();

	const form = useFormContext<ManageOrganizationFormSchema>();
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	async function handleSubmit(data: ManageOrganizationFormSchema) {
		const result = await onSubmit(data);

		if (result.success) {
			form.setValue("id", generateId());

			if (isNew) {
				router.push(`/organization/${data.id}`);
				return;
			}

			router.push("/organizations");
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

				<Separator />

				<OrganizationInviteLinks
					control={form.control}
					existingInviteLinks={organization?.organizationInviteLinks ?? []}
					variant="form"
				/>

				<Separator />

				<div className="flex justify-end space-x-4">
					{!isNew && user.organizationId !== form.getValues("id") && <OrganizationDeleteDialog />}
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
						disabled={form.formState.isSubmitting || (!isNew && !isFormDirty)}
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
						{isNew ? "Create" : "Update"} organization
					</Button>
				</div>
			</form>
		</>
	);
}

export { type ManageOrganizationFormProps, ManageOrganizationForm };
