"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { type VetClinicById } from "~/actions";
import { generateId } from "~/utils";
import { FormSection } from "../ui/form";
import { type ManageVetClinicFormSchema } from "./manage-vet-clinic";
import { VetClinicContactInformation } from "./vet-clinic-contact-information";
import { VetClinicToVetRelationships } from "./vet-clinic-to-vet-relationships";

type ManageVetClinicFormProps = {
	open?: never;
	setOpen?: never;
	onSuccessfulSubmit?: never;
	defaultValues?: never;
	withoutTrigger?: never;
	vetClinic?: VetClinicById;
	onSubmit: (data: ManageVetClinicFormSchema) => Promise<{ success: boolean }>;
};

function ManageVetClinicForm({ vetClinic, onSubmit }: ManageVetClinicFormProps) {
	const isNew = !vetClinic;

	const router = useRouter();

	const form = useFormContext<ManageVetClinicFormSchema>();

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	async function handleSubmit(data: ManageVetClinicFormSchema) {
		const result = await onSubmit(data);

		if (result.success) {
			if (isNew) {
				router.replace(`/vet-clinics/${data.id}`);
			} else {
				router.push("/vet-clinics");
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
				<VetClinicContactInformation control={form.control} variant="form" />

				<Separator className="my-4" />

				<FormSection
					title="Manage Relationships"
					description="Manage the relationships of this vet clinic between other vets within the system."
				>
					<VetClinicToVetRelationships
						control={form.control}
						existingVetToVetClinicRelationships={vetClinic?.vetToVetClinicRelationships}
						variant="form"
					/>
				</FormSection>

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
						{isNew ? "Create" : "Update"} vet clinic
					</Button>
				</div>
			</form>
		</>
	);
}

export { type ManageVetClinicFormProps, ManageVetClinicForm };
