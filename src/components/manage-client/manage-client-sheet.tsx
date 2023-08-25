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
import { type ClientById, type ClientInsert, type ClientUpdate } from "~/actions";
import { generateId, hasTrueValue } from "~/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { useToast } from "../ui/use-toast";
import { ClientDeleteDialog } from "./client-delete-dialog";
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

	const { toast } = useToast();

	const [_open, _setOpen] = React.useState(open || false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const form = useFormContext<ManageClientFormSchema>();
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);

	async function handleSubmit(data: ManageClientFormSchema) {
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
						<Button>Create client</Button>
					</SheetTrigger>
				)}
				<SheetContent className="w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl">
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

						<ClientToDogRelationships
							control={form.control}
							existingDogToClientRelationships={client?.dogToClientRelationships}
							variant="sheet"
							setOpen={setInternalOpen}
						/>

						<Separator className="my-4" />

						<SheetFooter>
							{!isNew && <ClientDeleteDialog />}
							<SheetClose asChild>
								<Button variant="outline">Cancel</Button>
							</SheetClose>
							<Button
								type="submit"
								disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}
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
