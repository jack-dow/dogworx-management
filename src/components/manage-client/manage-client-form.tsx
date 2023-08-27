"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { hasTrueValue } from "~/utils";
import { Form, FormSection } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { ClientDeleteDialog } from "./client-delete-dialog";
import { ClientPersonalInformation } from "./client-personal-information";
import { ClientToDogRelationships } from "./client-to-dog-relationships";
import { useManageClientForm, type UseManageClientFormProps } from "./use-manage-client-form";

function ManageClientForm({ client, onSubmit }: UseManageClientFormProps) {
	const isNew = !client;

	const { toast } = useToast();
	const router = useRouter();

	const { form, onSubmit: _onSubmit } = useManageClientForm({ client, onSubmit });
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
									router.replace(`/client/${data.id}`);
									return;
								}
								router.push("/clients");
							}
						})(e);
					}}
					className="space-y-6 lg:space-y-10"
				>
					<ClientPersonalInformation variant="form" />

					<Separator />

					<FormSection
						title="Manage Relationships"
						description="Manage the relationships of this client between other dogs within the system."
					>
						<ClientToDogRelationships
							existingDogToClientRelationships={client?.dogToClientRelationships}
							variant="form"
						/>
					</FormSection>

					<Separator />

					<div className="flex justify-end space-x-4">
						{!isNew && <ClientDeleteDialog />}
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
							{isNew ? "Create" : "Update"} client
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
}

export { ManageClientForm };
