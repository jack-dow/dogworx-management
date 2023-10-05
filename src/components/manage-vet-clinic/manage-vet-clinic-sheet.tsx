"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet";
import { useDidUpdate } from "~/hooks/use-did-update";
import { hasTrueValue } from "~/lib/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Form } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { useManageVetClinicForm, type UseManageVetClinicFormProps } from "./use-manage-vet-clinic-form";
import { VetClinicContactInformation } from "./vet-clinic-contact-information";
import { VetClinicDeleteDialog } from "./vet-clinic-delete-dialog";
import { VetClinicToVetRelationships } from "./vet-clinic-to-vet-relationships";

interface ManageVetClinicSheetProps extends Omit<ManageVetClinicSheetFormProps, "setOpen" | "setIsDirty" | "isNew"> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
}

function ManageVetClinicSheet(props: ManageVetClinicSheetProps) {
	// This is in state so that we can use the vet clinic prop as the open state as well when using the sheet without having a flash between update/new state on sheet closing
	const [isNew, setIsNew] = React.useState(!props.vetClinic);

	const pathname = usePathname();

	const [_open, _setOpen] = React.useState(props.open || false);
	const [isDirty, setIsDirty] = React.useState(false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = props.open ?? _open;
	const setInternalOpen = props.setOpen ?? _setOpen;

	React.useEffect(() => {
		if (internalOpen) {
			setIsNew(!props.vetClinic);
			return;
		}
	}, [internalOpen, props.vetClinic]);

	useDidUpdate(() => {
		setInternalOpen(false);
	}, [pathname]);

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
				{!props.withoutTrigger && (
					<SheetTrigger asChild>{props.trigger ?? <Button>Create vet clinic</Button>}</SheetTrigger>
				)}
				<SheetContent className="w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl">
					<SheetHeader>
						<SheetTitle>{isNew ? "Create" : "Update"} Vet Clinic</SheetTitle>
						<SheetDescription>
							Use this form to {isNew ? "create" : "update"} a vet clinic. Click {isNew ? "create" : "update"} vet
							clinic when you&apos;re finished.
						</SheetDescription>
					</SheetHeader>

					<Separator className="my-4" />

					<ManageVetClinicSheetForm {...props} setOpen={setInternalOpen} setIsDirty={setIsDirty} isNew={isNew} />
				</SheetContent>
			</Sheet>
		</>
	);
}

interface ManageVetClinicSheetFormProps extends UseManageVetClinicFormProps {
	setOpen: (open: boolean) => void;
	setIsDirty: (isDirty: boolean) => void;
	isNew: boolean;
	onDelete?: (id: string) => void;
}

function ManageVetClinicSheetForm({
	setOpen,
	setIsDirty,
	onSubmit,
	onSuccessfulSubmit,
	onDelete,
	vetClinic,
	defaultValues,
	isNew,
}: ManageVetClinicSheetFormProps) {
	const { toast } = useToast();

	const { form, onSubmit: _onSubmit } = useManageVetClinicForm({
		vetClinic,
		defaultValues,
		onSubmit,
		onSuccessfulSubmit: (data) => {
			onSuccessfulSubmit?.(data);

			setOpen(false);
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

	React.useEffect(() => {
		setIsDirty(isFormDirty);
	}, [isFormDirty, setIsDirty]);

	return (
		<Form {...form}>
			<form onSubmit={_onSubmit}>
				<VetClinicContactInformation variant="sheet" />

				<Separator className="my-4" />

				<VetClinicToVetRelationships isNew={isNew} variant="sheet" />

				<Separator className="my-4" />

				<SheetFooter className="items-center">
					{!isNew && (
						<>
							<VetClinicDeleteDialog
								onSuccessfulDelete={() => {
									setOpen(false);
									onDelete?.(form.getValues("id"));
								}}
							/>
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
				</SheetFooter>
			</form>
		</Form>
	);
}

export { type ManageVetClinicSheetProps, ManageVetClinicSheet };
