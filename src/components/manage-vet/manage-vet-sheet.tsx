"use client";

import * as React from "react";

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
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Form } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { useManageVetForm, type UseManageVetFormProps } from "./use-manage-vet-form";
import { VetContactInformation } from "./vet-contact-information";
import { VetDeleteDialog } from "./vet-delete-dialog";
import { VetToDogRelationships } from "./vet-to-dog-relationships";
import { VetToVetClinicRelationships } from "./vet-to-vet-clinic-relationships";

interface ManageVetSheetProps<VetProp extends VetById | undefined>
	extends Omit<ManageVetSheetFormProps<VetProp>, "setOpen" | "onConfirmCancel" | "setIsDirty" | "isNew"> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
}

function ManageVetSheet<VetProp extends VetById | undefined>(props: ManageVetSheetProps<VetProp>) {
	// This is in state so that we can use the vet prop as the open state as well when using the sheet without having a flash between update/new state on sheet closing
	const [isNew, setIsNew] = React.useState(!props.vet);

	const [_open, _setOpen] = React.useState(props.open || false);
	const [isDirty, setIsDirty] = React.useState(false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = props.open ?? _open;
	const setInternalOpen = props.setOpen ?? _setOpen;

	React.useEffect(() => {
		if (internalOpen) {
			setIsNew(!props.vet);
			return;
		}
	}, [internalOpen, props.vet]);

	return (
		<>
			<ConfirmFormNavigationDialog
				open={isConfirmCloseDialogOpen}
				onOpenChange={setIsConfirmCloseDialogOpen}
				onConfirm={() => {
					setInternalOpen(false);
					setIsConfirmCloseDialogOpen(false);
				}}
			/>

			<Sheet
				open={internalOpen}
				onOpenChange={(value) => {
					if (isDirty && value === false) {
						setIsConfirmCloseDialogOpen(true);
						return;
					}

					setInternalOpen(value);
				}}
			>
				{!props.withoutTrigger && <SheetTrigger asChild>{props.trigger ?? <Button>Create vet</Button>}</SheetTrigger>}

				<SheetContent className="w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl">
					<SheetHeader>
						<SheetTitle>{isNew ? "Create" : "Update"} Vet</SheetTitle>
						<SheetDescription>
							Use this form to {isNew ? "create" : "update"} a vet. Click {isNew ? "create" : "update"} vet when
							you&apos;re finished.
						</SheetDescription>
					</SheetHeader>

					<Separator className="my-4" />

					<ManageVetSheetForm
						{...props}
						setOpen={setInternalOpen}
						onConfirmCancel={() => {
							setIsConfirmCloseDialogOpen(true);
						}}
						setIsDirty={setIsDirty}
						isNew={isNew}
					/>
				</SheetContent>
			</Sheet>
		</>
	);
}

interface ManageVetSheetFormProps<VetProp extends VetById | undefined> extends UseManageVetFormProps {
	setOpen: (open: boolean) => void;
	setIsDirty: (isDirty: boolean) => void;
	onConfirmCancel: () => void;
	isNew: boolean;
	onSuccessfulSubmit?: (client: VetProp extends VetById ? VetUpdate : VetInsert) => void;
}

function ManageVetSheetForm<VetProp extends VetById | undefined>({
	setOpen,
	setIsDirty,
	onConfirmCancel,
	onSubmit,
	onSuccessfulSubmit,
	vet,
	defaultValues,
	isNew,
}: ManageVetSheetFormProps<VetProp>) {
	const { toast } = useToast();

	const { form, onSubmit: _onSubmit } = useManageVetForm({ vet, defaultValues, onSubmit });
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

	React.useEffect(() => {
		setIsDirty(isFormDirty);
	}, [isFormDirty, setIsDirty]);

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					void form.handleSubmit(async (data) => {
						const result = await _onSubmit(data);

						if (result.success) {
							if (result.data && onSuccessfulSubmit) {
								onSuccessfulSubmit(result.data);
							}

							setOpen(false);
						}
					})(e);
				}}
			>
				<VetContactInformation variant="sheet" />

				<Separator className="my-4" />

				<VetToVetClinicRelationships
					existingVetToVetClinicRelationships={vet?.vetToVetClinicRelationships}
					variant="sheet"
				/>

				<Separator className="my-4" />

				<VetToDogRelationships
					existingDogToVetRelationships={vet?.dogToVetRelationships}
					variant="sheet"
					setOpen={setOpen}
				/>

				<Separator className="my-4" />

				<SheetFooter>
					{!isNew && <VetDeleteDialog setOpen={setOpen} />}
					<SheetClose asChild>
						<Button
							variant="outline"
							onClick={(e) => {
								e.preventDefault();
								if (isFormDirty) {
									onConfirmCancel();
									return;
								}

								setOpen(false);
							}}
						>
							Cancel
						</Button>
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
		</Form>
	);
}

export { type ManageVetSheetProps, ManageVetSheet };
