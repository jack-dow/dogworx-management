"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
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
import { type OrganizationById, type OrganizationInsert, type OrganizationUpdate } from "~/actions";
import { useUser } from "~/app/(dashboard)/providers";
import { generateId, hasTrueValue } from "~/utils";
import { type ManageOrganizationFormSchema } from "./manage-organization";
import { OrganizationDeleteDialog } from "./organization-delete-dialog";
import { OrganizationInformation } from "./organization-information";
import { OrganizationInviteLinks } from "./organization-invite-links";

type DefaultValues = Partial<ManageOrganizationFormSchema>;

type ManageOrganizationSheetProps<OrganizationProp extends OrganizationById | undefined> = {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	onSubmit: (
		data: ManageOrganizationFormSchema,
	) => Promise<{ success: boolean; data: OrganizationUpdate | OrganizationInsert | null | undefined }>;
	onSuccessfulSubmit?: (
		organization: OrganizationProp extends OrganizationById ? OrganizationUpdate : OrganizationInsert,
	) => void;
	organization?: OrganizationProp;
	defaultValues?: DefaultValues;
};

function ManageOrganizationSheet<OrganizationProp extends OrganizationById | undefined>({
	open,
	setOpen,
	onSubmit,
	onSuccessfulSubmit,
	withoutTrigger = false,
	organization,
}: ManageOrganizationSheetProps<OrganizationProp>) {
	const isNew = !organization;

	const [_open, _setOpen] = React.useState(open || false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const router = useRouter();
	const user = useUser();
	const form = useFormContext<ManageOrganizationFormSchema>();
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

	async function handleSubmit(data: ManageOrganizationFormSchema) {
		const result = await onSubmit(data);

		if (result.success) {
			if (result.data && onSuccessfulSubmit) {
				onSuccessfulSubmit(result.data);
			}

			router.push("/organizations");

			form.reset();
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
						<Button>Create organization</Button>
					</SheetTrigger>
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

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							void form.handleSubmit(handleSubmit)(e);
						}}
					>
						<OrganizationInformation control={form.control} variant="sheet" />

						<Separator className="my-4" />

						<OrganizationInviteLinks
							control={form.control}
							existingInviteLinks={organization?.organizationInviteLinks ?? []}
							variant="sheet"
						/>

						<Separator className="my-4" />

						<SheetFooter>
							{!isNew && user.organizationId !== form.getValues("id") && <OrganizationDeleteDialog />}
							<SheetClose asChild>
								<Button variant="outline">Cancel</Button>
							</SheetClose>
							<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !isFormDirty)}>
								{form.formState.isSubmitting && <Loader size="sm" />}
								{isNew ? "Create" : "Update"} organization
							</Button>
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>
		</>
	);
}

export { type ManageOrganizationSheetProps, ManageOrganizationSheet };
