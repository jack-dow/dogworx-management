"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

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
import { useDidUpdate } from "~/hooks/use-did-update";
import { hasTrueValue } from "~/lib/utils";
import { ConfirmFormNavigationDialog } from "../ui/confirm-form-navigation-dialog";
import { Form } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { ClientDeleteDialog } from "./client-delete-dialog";
import { ClientPersonalInformation } from "./client-personal-information";
import { ClientToDogRelationships } from "./client-to-dog-relationships";
import { useManageClientForm, type UseManageClientFormProps } from "./use-manage-client-form";

interface ManageClientSheetProps
	extends Omit<ManageClientSheetFormProps, "setOpen" | "onConfirmCancel" | "setIsDirty" | "isNew"> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
}

function ManageClientSheet(props: ManageClientSheetProps) {
	// This is in state so that we can use the client prop as the open state as well when using the sheet without having a flash between update/new state on sheet closing
	const [isNew, setIsNew] = React.useState(!props.client);

	const pathname = usePathname();

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

interface ManageClientSheetFormProps extends UseManageClientFormProps {
	setOpen: (open: boolean) => void;
	setIsDirty: (isDirty: boolean) => void;
	onConfirmCancel: () => void;
	isNew: boolean;
	onClientDelete?: (id: string) => void;
}

function ManageClientSheetForm({
	setOpen,
	setIsDirty,
	onConfirmCancel,
	onSubmit,
	onSuccessfulSubmit,
	onClientDelete,
	client,
	defaultValues,
	isNew,
}: ManageClientSheetFormProps) {
	const { toast } = useToast();

	const { form, onSubmit: _onSubmit } = useManageClientForm({
		client,
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
				<ClientPersonalInformation variant="sheet" />

				<Separator className="my-4" />

				<ClientToDogRelationships isNew={isNew} variant="sheet" setOpen={setOpen} />

				<Separator className="my-4" />

				<SheetFooter>
					{!isNew && (
						<ClientDeleteDialog
							onSuccessfulDelete={() => {
								setOpen(false);
								onClientDelete?.(form.getValues("id"));
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
