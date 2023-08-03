"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ManageVetClinicSheetFormSchema } from "~/components/manage-vet-clinic-sheet";
import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { Form } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { actions, type VetClinicById } from "~/actions";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { generateId, mergeRelationships } from "~/utils";
import { VetClinicContactInformation } from "./vet-clinic-contact-information";
import { VetClinicToVetRelationships } from "./vet-clinic-to-vet-relationships";

const ManageVetClinicFormSchema = ManageVetClinicSheetFormSchema;

type ManageVetClinicFormSchema = ManageVetClinicSheetFormSchema;

function ManageVetClinicForm({ vetClinic }: { vetClinic?: VetClinicById }) {
	const isNew = !vetClinic;

	const router = useRouter();
	const { toast } = useToast();

	const form = useForm<ManageVetClinicFormSchema>({
		resolver: zodResolver(ManageVetClinicFormSchema),
		defaultValues: {
			id: vetClinic?.id || generateId(),
			...vetClinic,
			actions: {
				vetToVetClinicRelationships: {},
			},
		},
	});
	useConfirmPageNavigation(form.formState.isDirty);

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);

	React.useEffect(() => {
		function syncVetClinic(vetClinic: VetClinicById) {
			const actions = form.getValues("actions");
			form.reset(
				{
					...vetClinic,
					vetToVetClinicRelationships: mergeRelationships(
						form.getValues("vetToVetClinicRelationships"),
						vetClinic.vetToVetClinicRelationships,
						actions.vetToVetClinicRelationships,
					),
					actions,
				},
				{
					keepDirtyValues: true,
				},
			);
		}

		if (vetClinic) {
			syncVetClinic(vetClinic);
		}
	}, [vetClinic, form]);

	async function onSubmit(data: ManageVetClinicSheetFormSchema) {
		let success = false;

		if (vetClinic) {
			const response = await actions.app.vetClinics.update(data);
			success = response.success && !!response.data;
		} else {
			const response = await actions.app.vetClinics.insert(data);
			success = response.success;
		}

		if (success) {
			if (isNew) {
				router.replace(`/dogs/${data.id}`);
			} else {
				router.push("/dogs");
			}

			toast({
				title: `Vet Clinic ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} vet clinic "${data.name}"`,
			});

			form.setValue("id", generateId());
		} else {
			toast({
				title: `Vet Clinic ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} vet clinic "${
					data.name
				}". Please try again later.`,
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
					<VetClinicContactInformation control={form.control} />

					<Separator className="my-4" />

					<div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
						<div>
							<h2 className="text-base font-semibold leading-7 text-foreground">Manage Relationships</h2>
							<p className="text-sm leading-6 text-muted-foreground">
								Manage the relationships of this vet clinic between other vets within the system.
							</p>
						</div>
						<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 xl:col-span-2">
							<div className="sm:p-8">
								<VetClinicToVetRelationships
									control={form.control}
									existingVetToVetClinicRelationships={vetClinic?.vetToVetClinicRelationships}
								/>
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
							{isNew ? "Create" : "Update"} vetClinic
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
}

export { ManageVetClinicFormSchema, ManageVetClinicForm };
