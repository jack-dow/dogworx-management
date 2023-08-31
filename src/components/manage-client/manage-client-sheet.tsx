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
import { type ClientById, type ClientInsert, type ClientUpdate } from "~/actions";
import { hasTrueValue } from "~/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Form } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { ClientDeleteDialog } from "./client-delete-dialog";
import { ClientPersonalInformation } from "./client-personal-information";
import { ClientToDogRelationships } from "./client-to-dog-relationships";
import { useManageClientForm, type UseManageClientFormProps } from "./use-manage-client-form";

interface ManageClientSheetProps<ClientProp extends ClientById | undefined>
	extends Omit<ManageClientSheetFormProps<ClientProp>, "setOpen" | "onConfirmCancel" | "setIsDirty" | "isNew"> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
}

function ManageClientSheet<ClientProp extends ClientById | undefined>(props: ManageClientSheetProps<ClientProp>) {
	// This is in state so that we can use the client prop as the open state as well when using the sheet without having a flash between update/new state on sheet closing
	const [isNew, setIsNew] = React.useState(!props.client);

	const [_open, _setOpen] = React.useState(props.open || false);
	const [isDirty, setIsDirty] = React.useState(false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = props.open ?? _open;
	const setInternalOpen = props.setOpen ?? _setOpen;

	React.useEffect(() => {
		if (internalOpen) {
			setIsNew(!props.client);
			return;
		}
	}, [internalOpen, props.client]);

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
					<SheetTrigger asChild>{props.trigger ?? <Button>Create client</Button>}</SheetTrigger>
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

					<ManageClientSheetForm
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

interface ManageClientSheetFormProps<ClientProp extends ClientById | undefined> extends UseManageClientFormProps {
	setOpen: (open: boolean) => void;
	setIsDirty: (isDirty: boolean) => void;
	onConfirmCancel: () => void;
	isNew: boolean;
	onSuccessfulSubmit?: (client: ClientProp extends ClientById ? ClientUpdate : ClientInsert) => void;
}

function ManageClientSheetForm<ClientProp extends ClientById | undefined>({
	setOpen,
	setIsDirty,
	onConfirmCancel,
	onSubmit,
	onSuccessfulSubmit,
	client,
	defaultValues,
	isNew,
}: ManageClientSheetFormProps<ClientProp>) {
	const { toast } = useToast();

	const { form, onSubmit: _onSubmit } = useManageClientForm({ client, defaultValues, onSubmit });
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
				<ClientPersonalInformation variant="sheet" />

				<Separator className="my-4" />

				<ClientToDogRelationships
					existingDogToClientRelationships={client?.dogToClientRelationships}
					variant="sheet"
					setOpen={setOpen}
				/>

				<Separator className="my-4" />

				<SheetFooter>
					{!isNew && <ClientDeleteDialog />}
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
		</Form>
	);
}

export { type ManageClientSheetProps, ManageClientSheet };
