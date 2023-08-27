"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { hasTrueValue } from "~/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { FormSection } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { useManageVetForm, type UseManageVetFormProps } from "./use-manage-vet-form";
import { VetContactInformation } from "./vet-contact-information";
import { VetDeleteDialog } from "./vet-delete-dialog";
import { VetToDogRelationships } from "./vet-to-dog-relationships";
import { VetToVetClinicRelationships } from "./vet-to-vet-clinic-relationships";

function ManageVetForm({ vet, onSubmit }: UseManageVetFormProps) {
	const isNew = !vet;

	const { toast } = useToast();
	const router = useRouter();

	const { form, onSubmit: _onSubmit } = useManageVetForm({ vet, onSubmit });
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

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					void form.handleSubmit(async (data) => {
						const result = await _onSubmit(data);

						if (result.success) {
							if (isNew) {
								router.replace(`/vet/${data.id}`);
								return;
							}

							router.push("/vets");
						}
					})(e);
				}}
				className="space-y-6 lg:space-y-10"
			>
				<VetContactInformation variant="form" />

				<Separator />

				<FormSection
					title="Manage Relationships"
					description="Manage the relationships of this vet clinic between other vets within the system."
				>
					<VetToVetClinicRelationships
						existingVetToVetClinicRelationships={vet?.vetToVetClinicRelationships}
						variant="form"
					/>

					<Separator className="my-4" />

					<VetToDogRelationships existingDogToVetRelationships={vet?.dogToVetRelationships} variant="form" />
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
						{isNew ? "Create" : "Update"} vet
					</Button>
				</div>
			</form>
		</>
	);
}

export { ManageVetForm };
