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
import { type ClientById, type ClientInsert, type ClientUpdate } from "~/actions";
import { ClientPersonalInformation } from "./client-personal-information";
import { ClientToDogRelationships } from "./client-to-dog-relationships";
import { type ManageClientFormSchema } from "./manage-client";

type DefaultValues = Partial<ManageClientFormSchema>;

type ManageClientSheetProps<ClientProp extends ClientById | undefined> = {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	onSuccessfulSubmit?: (client: ClientProp extends ClientById ? ClientUpdate : ClientInsert) => void;
	onSubmit: (
		data: ManageClientFormSchema,
	) => Promise<{ success: boolean; data: ClientUpdate | ClientInsert | null | undefined }>;
	client?: ClientById;
	defaultValues?: DefaultValues;
};

function ManageClientSheet<ClientProp extends ClientById | undefined>({
	open,
	setOpen,
	withoutTrigger = false,
	onSuccessfulSubmit,
	onSubmit,
	client,
}: ManageClientSheetProps<ClientProp>) {
	const isNew = !client;

	const [_open, _setOpen] = React.useState(open || false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const form = useFormContext<ManageClientFormSchema>();

	async function handleSubmit(data: ManageClientFormSchema) {
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
						<Button>Create Client</Button>
					</SheetTrigger>
				)}
				<SheetContent className="w-full sm:max-w-md md:max-w-lg xl:max-w-xl">
					<SheetHeader>
						<SheetTitle>{isNew ? "Create" : "Update"} Client</SheetTitle>
						<SheetDescription>
							Use this form to {isNew ? "create" : "update"} a client. Click {isNew ? "create" : "update"} client when
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
						<ClientPersonalInformation control={form.control} variant="sheet" />

						<Separator className="my-4" />

						<ClientToDogRelationships control={form.control} isNew={isNew} variant="sheet" />

						<Separator className="my-4" />

						<SheetFooter>
							<SheetClose asChild>
								<Button variant="outline">Cancel</Button>
							</SheetClose>
							<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}>
								{form.formState.isSubmitting && <Loader size="sm" />}
								{isNew ? "Create" : "Update"} client
							</Button>
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>
		</>
	);
}

export { type ManageClientSheetProps, ManageClientSheet };