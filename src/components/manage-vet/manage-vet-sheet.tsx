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
import { type VetById, type VetInsert, type VetUpdate } from "~/actions";
import { hasTrueValue } from "~/utils";
import { type ManageVetFormSchemaType } from "./manage-vet";
import { VetContactInformation } from "./vet-contact-information";
import { VetDeleteDialog } from "./vet-delete-dialog";
import { VetToDogRelationships } from "./vet-to-dog-relationships";
import { VetToVetClinicRelationships } from "./vet-to-vet-clinic-relationships";

type DefaultValues = Partial<ManageVetFormSchemaType>;

type ManageVetSheetProps<VetProp extends VetById | undefined> = {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	onSubmit: (
		data: ManageVetFormSchemaType,
	) => Promise<{ success: boolean; data: VetUpdate | VetInsert | null | undefined }>;
	onSuccessfulSubmit?: (vet: VetProp extends VetById ? VetUpdate : VetInsert) => void;
	vet?: VetProp;
	defaultValues?: DefaultValues;
};

function ManageVetSheet<VetProp extends VetById | undefined>({
	open,
	setOpen,
	onSubmit,
	onSuccessfulSubmit,
	withoutTrigger = false,
	vet,
}: ManageVetSheetProps<VetProp>) {
	const isNew = !vet;

	const [_open, _setOpen] = React.useState(open || false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const form = useFormContext<ManageVetFormSchemaType>();
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

	async function handleSubmit(data: ManageVetFormSchemaType) {
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
					if (isFormDirty && value === false) {
						setIsConfirmCloseDialogOpen(true);
						return;
					}

					setInternalOpen(value);
					form.reset();
				}}
			>
				{!withoutTrigger && (
					<SheetTrigger asChild>
						<Button>Create Vet</Button>
					</SheetTrigger>
				)}
				<SheetContent className="w-full sm:max-w-md md:max-w-lg xl:max-w-xl">
					<SheetHeader>
						<SheetTitle>{isNew ? "Create" : "Update"} Vet</SheetTitle>
						<SheetDescription>
							Use this form to {isNew ? "create" : "update"} a vet. Click {isNew ? "create" : "update"} vet when
							you&apos;re finished.
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
						<VetContactInformation control={form.control} variant="sheet" />

						<Separator className="my-4" />

						<VetToVetClinicRelationships
							control={form.control}
							existingVetToVetClinicRelationships={vet?.vetToVetClinicRelationships}
							variant="sheet"
						/>

						<Separator className="my-4" />

						<VetToDogRelationships control={form.control} isNew={isNew} variant="sheet" />

						<Separator className="my-4" />

						<SheetFooter>
							{!isNew && <VetDeleteDialog />}
							<SheetClose asChild>
								<Button variant="outline">Cancel</Button>
							</SheetClose>
							<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !isFormDirty)}>
								{form.formState.isSubmitting && <Loader size="sm" />}
								{isNew ? "Create" : "Update"} vet
							</Button>
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>
		</>
	);
}

export { type ManageVetSheetProps, ManageVetSheet };
