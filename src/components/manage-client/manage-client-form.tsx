"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { type ClientById } from "~/actions";
import { generateId } from "~/utils";
import { ClientPersonalInformation } from "./client-personal-information";
import { ClientToDogRelationships } from "./client-to-dog-relationships";
import { type ManageClientFormSchema } from "./manage-client";

type ManageClientFormProps = {
	open?: never;
	setOpen?: never;
	onSuccessfulSubmit?: never;
	defaultValues?: never;
	withoutTrigger?: never;
	client?: ClientById;
	onSubmit: (data: ManageClientFormSchema) => Promise<{ success: boolean }>;
};

function ManageClientForm({ client, onSubmit }: ManageClientFormProps) {
	const isNew = !client;

	const router = useRouter();

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	const form = useFormContext<ManageClientFormSchema>();

	async function handleSubmit(data: ManageClientFormSchema) {
		const result = await onSubmit(data);

		if (result.success) {
			if (isNew) {
				router.replace(`/dogs/${data.id}`);
			} else {
				router.push("/dogs");
			}
			form.setValue("id", generateId());
		}
	}

	return (
		<>
			<ConfirmFormNavigationDialog
				open={isConfirmNavigationDialogOpen}
				onOpenChange={() => {
					setIsConfirmNavigationDialogOpen(false);
				}}
				onConfirm={() => {
					router.back();
				}}
			/>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					void form.handleSubmit(handleSubmit)(e);
				}}
				className="space-y-6 lg:space-y-10"
			>
				<ClientPersonalInformation control={form.control} type="form" />

				<Separator className="my-4" />

				<ClientToDogRelationships control={form.control} isNew={isNew} type="form" />

				<Separator className="my-4" />

				<div className="flex justify-end space-x-4">
					<Button
						type="button"
						onClick={() => {
							if (form.formState.isDirty) {
								setIsConfirmNavigationDialogOpen(true);
							} else {
								router.back();
							}
						}}
						variant="outline"
					>
						Back
					</Button>
					<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}>
						{form.formState.isSubmitting && <Loader size="sm" />}
						{isNew ? "Create" : "Update"} client
					</Button>
				</div>
			</form>
		</>
	);
}

export { type ManageClientFormProps, ManageClientForm };
