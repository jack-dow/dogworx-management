"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ManageClientSheetFormSchema } from "~/components/manage-client-sheet";
import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Form } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { actions, type ClientById } from "~/actions";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { generateId, mergeRelationships } from "~/utils";
import { ClientPersonalInformation } from "./client-personal-information";
import { ClientToDogRelationships } from "./client-to-dog-relationships";

const ManageClientFormSchema = ManageClientSheetFormSchema;

type ManageClientFormSchema = ManageClientSheetFormSchema;

function ManageClientForm({ client }: { client?: ClientById }) {
	const isNew = !client;

	const router = useRouter();
	const { toast } = useToast();

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	const form = useForm<ManageClientFormSchema>({
		resolver: zodResolver(ManageClientFormSchema),
		defaultValues: {
			id: client?.id || generateId(),
			...client,
			actions: {
				dogToClientRelationships: {},
			},
		},
	});
	useConfirmPageNavigation(form.formState.isDirty);

	React.useEffect(() => {
		function syncClient(client: ClientById) {
			const actions = form.getValues("actions");
			form.reset(
				{
					...client,
					dogToClientRelationships: mergeRelationships(
						form.getValues("dogToClientRelationships"),
						client?.dogToClientRelationships ?? [],
						actions.dogToClientRelationships,
					),
					actions,
				},
				{
					keepDirtyValues: true,
				},
			);
		}

		if (client) {
			syncClient(client);
		}
	}, [client, form, toast]);

	async function onSubmit(data: ManageClientFormSchema) {
		let success = false;

		if (client) {
			const response = await actions.app.clients.update(data);
			success = response.success;
		} else {
			const response = await actions.app.clients.insert(data);
			success = response.success;
		}

		if (success) {
			if (isNew) {
				router.replace(`/dogs/${data.id}`);
			} else {
				router.push("/dogs");
			}

			toast({
				title: `Client ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} client "${data.givenName}${
					data.familyName ? " " + data.familyName : ""
				}"`,
			});

			form.setValue("id", generateId());
		} else {
			toast({
				title: `Client ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} client "${data.givenName}${
					data.familyName ? " " + data.familyName : ""
				}". Please try again later.`,
				variant: "destructive",
			});
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

			<Form {...form}>
				<form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)} className="space-y-6 lg:space-y-10">
					<ClientPersonalInformation control={form.control} />

					<Separator className="my-4" />

					<div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
						<div>
							<h2 className="text-base font-semibold leading-7 text-foreground">Manage Relationships</h2>
							<p className="text-sm leading-6 text-muted-foreground">
								Manage the relationships of this client between other dogs within the system.
							</p>
						</div>
						<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 xl:col-span-2">
							<div className="sm:p-8">
								<ClientToDogRelationships control={form.control} isNew={isNew} />
							</div>
						</div>
					</div>

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
			</Form>
		</>
	);
}

export { ManageClientFormSchema, ManageClientForm };
