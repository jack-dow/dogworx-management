"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { hasTrueValue } from "~/utils";
import { FormSection } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { useManageVetClinicForm, type UseManageVetClinicFormProps } from "./use-manage-vet-clinic-form";
import { VetClinicContactInformation } from "./vet-clinic-contact-information";
import { VetClinicDeleteDialog } from "./vet-clinic-delete-dialog";
import { VetClinicToVetRelationships } from "./vet-clinic-to-vet-relationships";

function ManageVetClinicForm({ vetClinic, onSubmit }: UseManageVetClinicFormProps) {
	const isNew = !vetClinic;

	const { toast } = useToast();
	const router = useRouter();

	const { form, onSubmit: _onSubmit } = useManageVetClinicForm({ vetClinic, onSubmit });
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
								router.replace(`/vet-clinic/${data.id}`);
								return;
							}
							router.push("/vet-clinics");
						}
					})(e);
				}}
				className="space-y-6 lg:space-y-10"
			>
				<VetClinicContactInformation variant="form" />

				<Separator />

				<FormSection
					title="Manage Relationships"
					description="Manage the relationships of this vet clinic between other vets within the system."
				>
					<VetClinicToVetRelationships
						existingVetToVetClinicRelationships={vetClinic?.vetToVetClinicRelationships}
						variant="form"
					/>
				</FormSection>

				<Separator />

				<div className="flex justify-end space-x-4">
					{!isNew && <VetClinicDeleteDialog />}
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
						{isNew ? "Create" : "Update"} vet clinic
					</Button>
				</div>
			</form>
		</>
	);
}

export { ManageVetClinicForm };
