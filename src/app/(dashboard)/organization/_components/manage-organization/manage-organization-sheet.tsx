"use client";

import * as React from "react";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Form } from "~/components/ui/form";
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
import { useToast } from "~/components/ui/use-toast";
import { type OrganizationById, type OrganizationInsert, type OrganizationUpdate } from "~/actions";
import { useUser } from "~/app/providers";
import { hasTrueValue } from "~/utils";
import { OrganizationDeleteDialog } from "./organization-delete-dialog";
import { OrganizationInformation } from "./organization-information";
import { OrganizationInviteLinks } from "./organization-invite-links";
import { OrganizationUsers } from "./organization-users";
import { useManageOrganizationForm, type UseManageOrganizationFormProps } from "./use-manage-organization-form";

interface ManageOrganizationSheetProps<OrganizationProp extends OrganizationById | undefined>
	extends Omit<
		ManageOrganizationSheetFormProps<OrganizationProp>,
		"setOpen" | "onConfirmCancel" | "setIsDirty" | "isNew"
	> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
}

function ManageOrganizationSheet<OrganizationProp extends OrganizationById | undefined>(
	props: ManageOrganizationSheetProps<OrganizationProp>,
) {
	// This is in state so that we can use the organization prop as the open state as well when using the sheet without having a flash between update/new state on sheet closing
	const [isNew, setIsNew] = React.useState(!props.organization);

	const [_open, _setOpen] = React.useState(props.open || false);
	const [isDirty, setIsDirty] = React.useState(false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = props.open ?? _open;
	const setInternalOpen = props.setOpen ?? _setOpen;

	React.useEffect(() => {
		if (internalOpen) {
			setIsNew(!props.organization);
			return;
		}
	}, [internalOpen, props.organization]);

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
					<SheetTrigger asChild>{props.trigger ?? <Button>Create organization</Button>}</SheetTrigger>
				)}

				<SheetContent className="w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl">
					<SheetHeader>
						<SheetTitle>{isNew ? "Create" : "Update"} Organization</SheetTitle>
						<SheetDescription>
							Use this form to {isNew ? "create" : "update"} a organization. Click {isNew ? "create" : "update"}{" "}
							organization when you&apos;re finished.
						</SheetDescription>
					</SheetHeader>

					<Separator className="my-4" />

					<ManageOrganizationSheetForm
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

interface ManageOrganizationSheetFormProps<OrganizationProp extends OrganizationById | undefined>
	extends UseManageOrganizationFormProps {
	setOpen: (open: boolean) => void;
	setIsDirty: (isDirty: boolean) => void;
	onConfirmCancel: () => void;
	isNew: boolean;
	onSuccessfulSubmit?: (
		client: OrganizationProp extends OrganizationById ? OrganizationUpdate : OrganizationInsert,
	) => void;
}

function ManageOrganizationSheetForm<OrganizationProp extends OrganizationById | undefined>({
	setOpen,
	setIsDirty,
	onConfirmCancel,
	onSubmit,
	onSuccessfulSubmit,
	organization,
	defaultValues,
	isNew,
}: ManageOrganizationSheetFormProps<OrganizationProp>) {
	const user = useUser();

	const { toast } = useToast();

	const { form, onSubmit: _onSubmit } = useManageOrganizationForm({ organization, defaultValues, onSubmit });
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
				<OrganizationInformation variant="sheet" />

				<Separator className="my-4" />

				<OrganizationInviteLinks existingInviteLinks={organization?.organizationInviteLinks ?? []} variant="sheet" />

				<Separator className="my-4" />

				<OrganizationUsers variant="form" existingUsers={organization?.users ?? []} />

				<Separator className="my-4" />

				<SheetFooter>
					{!isNew && user.organizationId !== form.getValues("id") && (
						<OrganizationDeleteDialog
							onSuccessfulDelete={() => {
								setOpen(false);
							}}
						/>
					)}
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
						{isNew ? "Create" : "Update"} organization
					</Button>
				</SheetFooter>
			</form>
		</Form>
	);
}

export { type ManageOrganizationSheetProps, ManageOrganizationSheet };
