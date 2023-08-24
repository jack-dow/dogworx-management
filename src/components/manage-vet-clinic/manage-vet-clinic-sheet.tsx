"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet";
import { type VetClinicById, type VetClinicInsert, type VetClinicUpdate } from "~/actions";
import { generateId, hasTrueValue } from "~/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { type ManageVetClinicFormSchemaType } from "./manage-vet-clinic";
import { VetClinicContactInformation } from "./vet-clinic-contact-information";
import { VetClinicDeleteDialog } from "./vet-clinic-delete-dialog";
import { VetClinicToVetRelationships } from "./vet-clinic-to-vet-relationships";

type DefaultValues = Partial<ManageVetClinicFormSchemaType>;

type ManageVetClinicSheetProps<VetClinicProp extends VetClinicById | undefined> = {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	onSubmit: (
		data: ManageVetClinicFormSchemaType,
	) => Promise<{ success: boolean; data: VetClinicUpdate | VetClinicInsert | null | undefined }>;
	onSuccessfulSubmit?: (vetClinic: VetClinicProp extends VetClinicById ? VetClinicUpdate : VetClinicInsert) => void;
	vetClinic?: VetClinicProp;
	defaultValues?: DefaultValues;
};

function ManageVetClinicSheet<VetClinicProp extends VetClinicById | undefined>({
	open,
	setOpen,
	withoutTrigger = false,
	onSubmit,
	onSuccessfulSubmit,
	vetClinic,
}: ManageVetClinicSheetProps<VetClinicProp>) {
	const isNew = !vetClinic;

	const [_open, _setOpen] = React.useState(open || false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const form = useFormContext<ManageVetClinicFormSchemaType>();
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

	async function handleSubmit(data: ManageVetClinicFormSchemaType) {
		const result = await onSubmit(data);

		if (result.success) {
			if (result.data && onSuccessfulSubmit) {
				onSuccessfulSubmit(result.data);
			}

			setInternalOpen(false);

			setTimeout(() => {
				form.reset();
				form.setValue("id", generateId());
			}, 205);
		}
	}

	function handleClose() {
		setInternalOpen(false);
		setTimeout(() => {
			form.reset();
			form.setValue("id", generateId());
		}, 205);
	}

	return (
		<>
			<ConfirmFormNavigationDialog
				open={isConfirmCloseDialogOpen}
				onOpenChange={setIsConfirmCloseDialogOpen}
				onConfirm={() => {
					handleClose();
					setIsConfirmCloseDialogOpen(false);
				}}
			/>

			<Sheet
				open={internalOpen}
				onOpenChange={(value) => {
					// Form state check **MUST** be first otherwise a bug occurs where it is always false on the first close
					if (isFormDirty && value === false) {
						setIsConfirmCloseDialogOpen(true);
						return;
					}

					if (value === false) {
						handleClose();
					}

					setInternalOpen(value);
				}}
			>
				{!withoutTrigger && (
					<SheetTrigger asChild>
						<Button>Create vet clinic</Button>
					</SheetTrigger>
				)}
				<SheetContent className="w-full sm:max-w-md md:max-w-lg xl:max-w-xl">
					<SheetHeader>
						<SheetTitle>{isNew ? "Create" : "Update"} Vet Clinic</SheetTitle>
						<SheetDescription>
							Use this form to {isNew ? "create" : "update"} a vet clinic. Click {isNew ? "create" : "update"} vet
							clinic when you&apos;re finished.
						</SheetDescription>
					</SheetHeader>

					<Separator className="my-4" />

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							void form.handleSubmit(handleSubmit)(e);
						}}
					>
						<VetClinicContactInformation control={form.control} variant="sheet" />

						<Separator className="my-4" />

						<VetClinicToVetRelationships
							control={form.control}
							existingVetToVetClinicRelationships={vetClinic?.vetToVetClinicRelationships}
							variant="sheet"
						/>

						<Separator className="my-4" />

						<SheetFooter>
							{!isNew && <VetClinicDeleteDialog />}
							<SheetClose asChild>
								<Button variant="outline">Cancel</Button>
							</SheetClose>
							<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !isFormDirty)}>
								{form.formState.isSubmitting && <Loader size="sm" />}
								{isNew ? "Create" : "Update"} vet clinic
							</Button>
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>
		</>
	);
}

export { type ManageVetClinicSheetProps, ManageVetClinicSheet };
