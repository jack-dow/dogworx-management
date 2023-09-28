"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { hasTrueValue } from "~/lib/utils";
import { Form, FormSection } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { useManageVetClinicForm, type UseManageVetClinicFormProps } from "./use-manage-vet-clinic-form";
import { VetClinicContactInformation } from "./vet-clinic-contact-information";
import { VetClinicDeleteDialog } from "./vet-clinic-delete-dialog";
import { VetClinicToVetRelationships } from "./vet-clinic-to-vet-relationships";

function ManageVetClinicForm({ vetClinic, onSubmit, onSuccessfulSubmit }: UseManageVetClinicFormProps) {
	const isNew = !vetClinic;

	const { toast } = useToast();
	const router = useRouter();

	const { form, onSubmit: _onSubmit } = useManageVetClinicForm({
		vetClinic,
		onSubmit,
		onSuccessfulSubmit: (data) => {
			onSuccessfulSubmit?.(data);

			if (isNew) {
				router.replace(`/vet-clinics/${data.id}`);
				return;
			}

			router.push("/vet-clinics");
		},
	});
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
				<form onSubmit={_onSubmit} className="space-y-6 lg:space-y-10">
					<VetClinicContactInformation variant="form" />

					<Separator />

					<FormSection
						title="Manage Relationships"
						description="Manage the relationships of this vet clinic between other vets within the system."
					>
						<VetClinicToVetRelationships isNew={isNew} variant="form" />
					</FormSection>

					<Separator />

					<div className="flex items-center justify-end space-x-3">
						{!isNew && (
							<>
								<VetClinicDeleteDialog />
								<Separator orientation="vertical" className="h-4" />
							</>
						)}

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
			</Form>
		</>
	);
}

export { ManageVetClinicForm };
