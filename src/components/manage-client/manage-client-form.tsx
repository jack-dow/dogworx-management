"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { type ClientById } from "~/actions";
import { generateId, hasTrueValue } from "~/utils";
import { FormSection } from "../ui/form";
import { ClientDeleteDialog } from "./client-delete-dialog";
import { ClientPersonalInformation } from "./client-personal-information";
import { ClientToDogRelationships } from "./client-to-dog-relationships";
import { type ManageClientFormSchema } from "./manage-client";

type ManageClientFormProps = {
	open?: never;
	setOpen?: never;
	onSuccessfulSubmit?: never;
	defaultValues?: never;
	withoutTrigger?: never;
	client?: ClientById;
	onSubmit: (data: ManageClientFormSchema) => Promise<{ success: boolean }>;
};

function ManageClientForm({ client, onSubmit }: ManageClientFormProps) {
	const isNew = !client;

	const router = useRouter();

	const form = useFormContext<ManageClientFormSchema>();
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	async function handleSubmit(data: ManageClientFormSchema) {
		const result = await onSubmit(data);

		if (result.success) {
			router.push("/clients");

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
				<ClientPersonalInformation control={form.control} variant="form" />

				<Separator />

				<FormSection
					title="Manage Relationships"
					description="Manage the relationships of this client between other dogs within the system."
				>
					<ClientToDogRelationships
						control={form.control}
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
					<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !isFormDirty)}>
						{form.formState.isSubmitting && <Loader size="sm" />}
						{isNew ? "Create" : "Update"} client
					</Button>
				</div>
			</form>
		</>
	);
}

export { type ManageClientFormProps, ManageClientForm };
