"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { type VetById } from "~/actions";
import { generateId, hasTrueValue } from "~/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { FormSection } from "../ui/form";
import { type ManageVetFormSchemaType } from "./manage-vet";
import { VetContactInformation } from "./vet-contact-information";
import { VetDeleteDialog } from "./vet-delete-dialog";
import { VetToDogRelationships } from "./vet-to-dog-relationships";
import { VetToVetClinicRelationships } from "./vet-to-vet-clinic-relationships";

type ManageVetFormProps = {
	open?: never;
	setOpen?: never;
	onSuccessfulSubmit?: never;
	defaultValues?: never;
	withoutTrigger?: never;
	vet?: VetById;
	onSubmit: (data: ManageVetFormSchemaType) => Promise<{ success: boolean }>;
};

function ManageVetForm({ vet, onSubmit }: ManageVetFormProps) {
	const isNew = !vet;

	const router = useRouter();

	const form = useFormContext<ManageVetFormSchemaType>();
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	async function handleSubmit(data: ManageVetFormSchemaType) {
		const result = await onSubmit(data);

		if (result.success) {
			if (isNew) {
				router.replace(`/vet/${data.id}`);
			} else {
				router.push("/vets");
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
				<VetContactInformation control={form.control} variant="form" />

				<Separator />

				<FormSection
					title="Manage Relationships"
					description="Manage the relationships of this vet clinic between other vets within the system."
				>
					<VetToVetClinicRelationships
						control={form.control}
						existingVetToVetClinicRelationships={vet?.vetToVetClinicRelationships}
						variant="form"
					/>

					<Separator className="my-4" />

					<VetToDogRelationships control={form.control} isNew={isNew} variant="form" />
				</FormSection>

				<Separator />

				<div className="flex justify-end space-x-4">
					{!isNew && <VetDeleteDialog />}
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
						{isNew ? "Create" : "Update"} vet
					</Button>
				</div>
			</form>
		</>
	);
}

export { type ManageVetFormProps, ManageVetForm };
