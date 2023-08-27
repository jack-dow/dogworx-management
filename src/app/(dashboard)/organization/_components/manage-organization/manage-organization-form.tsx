"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Form } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { useUser } from "~/app/(dashboard)/providers";
import { hasTrueValue } from "~/utils";
import { OrganizationDeleteDialog } from "./organization-delete-dialog";
import { OrganizationInformation } from "./organization-information";
import { OrganizationInviteLinks } from "./organization-invite-links";
import { useManageOrganizationForm, type UseManageOrganizationFormProps } from "./use-manage-organization-form";

function ManageOrganizationForm({ organization, onSubmit }: UseManageOrganizationFormProps) {
	const isNew = !organization;

	const user = useUser();

	const { toast } = useToast();
	const router = useRouter();

	const { form, onSubmit: _onSubmit } = useManageOrganizationForm({ organization, onSubmit });
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

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
							const result = await _onSubmit(data);

							if (result.success) {
								if (isNew) {
									router.replace(`/organization/${data.id}`);
									return;
								}
								router.push("/organizations");
							}
						})(e);
					}}
					className="space-y-6 lg:space-y-10"
				>
					<OrganizationInformation variant="form" />

					<Separator />

					<OrganizationInviteLinks existingInviteLinks={organization?.organizationInviteLinks ?? []} variant="form" />

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
			</Form>
		</>
	);
}

export { ManageOrganizationForm };
