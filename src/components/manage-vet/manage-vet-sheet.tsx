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
import { type VetById, type VetInsert, type VetUpdate } from "~/actions";
import { generateId, hasTrueValue } from "~/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { useToast } from "../ui/use-toast";
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

	const { toast } = useToast();

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
						return;
					}

					setInternalOpen(value);
				}}
			>
				{!withoutTrigger && (
					<SheetTrigger asChild>
						<Button>Create vet</Button>
					</SheetTrigger>
				)}
				<SheetContent className="w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl">
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

						<VetToDogRelationships
							control={form.control}
							existingDogToVetRelationships={vet?.dogToVetRelationships}
							variant="sheet"
							setOpen={setInternalOpen}
						/>

						<Separator className="my-4" />

						<SheetFooter>
							{!isNew && <VetDeleteDialog />}
							<SheetClose asChild>
								<Button variant="outline">Cancel</Button>
							</SheetClose>
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
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>
		</>
	);
}

export { type ManageVetSheetProps, ManageVetSheet };
