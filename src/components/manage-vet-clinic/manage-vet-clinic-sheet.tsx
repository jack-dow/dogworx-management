"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
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
import { type ManageVetClinicFormSchema } from "./manage-vet-clinic";
import { VetClinicContactInformation } from "./vet-clinic-contact-information";
import { VetClinicToVetRelationships } from "./vet-clinic-to-vet-relationships";

type DefaultValues = Partial<ManageVetClinicFormSchema>;

type ManageVetClinicSheetProps<VetClinicProp extends VetClinicById | undefined> = {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	onSubmit: (
		data: ManageVetClinicFormSchema,
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

	const form = useFormContext<ManageVetClinicFormSchema>();

	async function handleSubmit(data: ManageVetClinicFormSchema) {
		const result = await onSubmit(data);

		if (result.success) {
			if (result.data && onSuccessfulSubmit) {
				onSuccessfulSubmit(result.data);
			}

			setInternalOpen(false);
			form.reset();
		}
	}

	return (
		<>
			<AlertDialog open={isConfirmCloseDialogOpen} onOpenChange={setIsConfirmCloseDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Unsaved changes</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to close this form? If you do, any unsaved changes will be lost.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setInternalOpen(false);
								form.reset();
							}}
						>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Sheet
				open={internalOpen}
				onOpenChange={(value) => {
					// Form state check **MUST** be first otherwise a bug occurs where it is always false on the first close
					if (form.formState.isDirty && value === false) {
						setIsConfirmCloseDialogOpen(true);
						return;
					}

					setInternalOpen(value);
					form.reset();
				}}
			>
				{!withoutTrigger && (
					<SheetTrigger asChild>
						<Button>Create Vet Clinic</Button>
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
							<SheetClose asChild>
								<Button variant="outline">Cancel</Button>
							</SheetClose>
							<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}>
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
