"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import {
	api,
	generateId,
	InsertVetClinicSchema,
	InsertVetToVetClinicRelationshipSchema,
	SelectVetSchema,
	type VetClinicInsert,
	type VetClinicRelationships,
	type VetClinicsList,
	type VetClinicsSearch,
	type VetClinicUpdate,
} from "~/api";
import { mergeRelationships } from "~/lib/utils";
import { prettyStringValidationMessage } from "~/lib/validations/utils";
import { VetClinicContactInformation } from "./vet-clinic-contact-information";
import { VetClinicToVetRelationships } from "./vet-clinic-to-vet-relationships";

const ManageVetClinicSheetFormSchema = InsertVetClinicSchema.extend({
	name: prettyStringValidationMessage("Name", 2, 50),
	emailAddress: prettyStringValidationMessage("Email address", 1, 75).email({
		message: "Email address must be a valid email",
	}),
	phoneNumber: prettyStringValidationMessage("Phone number", 9, 16),
	notes: prettyStringValidationMessage("Notes", 0, 500).nullish(),
	vetToVetClinicRelationships: z.array(InsertVetToVetClinicRelationshipSchema.extend({ vet: SelectVetSchema })),
});
type ManageVetClinicSheetFormSchema = z.infer<typeof ManageVetClinicSheetFormSchema>;

type DefaultValues = Partial<ManageVetClinicSheetFormSchema>;
type ExistingVetClinic = Omit<VetClinicsList[number] | VetClinicsSearch[number], "vetToVetClinicRelationships"> &
	Partial<VetClinicRelationships>;

type ManageVetClinicSheetProps<VetClinicProp extends ExistingVetClinic | undefined> =
	| {
			open: boolean;
			setOpen: (open: boolean) => void;
			onSuccessfulSubmit?: (
				vetClinic: VetClinicProp extends ExistingVetClinic ? VetClinicUpdate : VetClinicInsert,
			) => void;
			vetClinic?: VetClinicProp;
			defaultValues?: DefaultValues;
			withoutTrigger?: boolean;
	  }
	| {
			open?: undefined;
			setOpen?: null;
			onSuccessfulSubmit?: (
				vetClinic: VetClinicProp extends ExistingVetClinic ? VetClinicUpdate : VetClinicInsert,
			) => void;
			vetClinic?: VetClinicProp;
			defaultValues?: DefaultValues;
			withoutTrigger?: boolean;
	  };

function ManageVetClinicSheet<VetClinicProp extends ExistingVetClinic | undefined>({
	open,
	setOpen,
	onSuccessfulSubmit,
	withoutTrigger = false,
	vetClinic,
	defaultValues,
}: ManageVetClinicSheetProps<VetClinicProp>) {
	const isNew = !vetClinic;

	const { toast } = useToast();

	const [_open, _setOpen] = React.useState(open || false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);
	const [isLoadingRelationships, setIsLoadingRelationships] = React.useState(false);

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const form = useForm<ManageVetClinicSheetFormSchema>({
		resolver: zodResolver(ManageVetClinicSheetFormSchema),
		defaultValues: {
			id: vetClinic?.id || defaultValues?.id || generateId(),
			vetToVetClinicRelationships: vetClinic?.vetToVetClinicRelationships,
			...vetClinic,
			...defaultValues,
			actions: {
				vetToVetClinicRelationships: {},
			},
		},
	});

	React.useEffect(() => {
		function syncVetClinic(vetClinic: ExistingVetClinic) {
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
			if (!vetClinic.vetToVetClinicRelationships) {
				setIsLoadingRelationships(true);
				const fetchRelationships = async () => {
					const response = await api.vetClinics.getRelationships(vetClinic.id);
					if (response.success) {
						syncVetClinic({
							...vetClinic,
							vetToVetClinicRelationships: response.data.vetToVetClinicRelationships,
						});
					}
					setIsLoadingRelationships(false);
				};
				void fetchRelationships();
				return;
			}

			syncVetClinic(vetClinic);
		}
	}, [vetClinic, form]);

	async function onSubmit(data: ManageVetClinicSheetFormSchema) {
		let success = false;
		let newVetClinic: VetClinicUpdate | VetClinicInsert | undefined;

		if (vetClinic) {
			const response = await api.vetClinics.update(data);
			success = response.success && !!response.data;
			newVetClinic = response.data;
		} else {
			const response = await api.vetClinics.insert(data);
			success = response.success;
			newVetClinic = response.data;
		}

		if (success) {
			if (newVetClinic && onSuccessfulSubmit) {
				onSuccessfulSubmit(newVetClinic);
			}

			toast({
				title: `Vet Clinic ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} vet clinic "${data.name}"`,
			});

			setInternalOpen(false);
			form.reset();
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
						<Button>Create Vet Clinic</Button>
					</SheetTrigger>
				)}
				<SheetContent className="w-full sm:max-w-md md:max-w-lg xl:max-w-xl">
					<SheetHeader>
						<SheetTitle>{isNew ? "Create" : "Update"} Vet Clinic</SheetTitle>
						<SheetDescription>
							Use this form to {isNew ? "create" : "update"} a vet clinic. Click {isNew ? "create" : "update"} vet
							clinic when you&apos;re finished.
						</SheetDescription>
					</SheetHeader>

					<Separator className="my-4" />

					<Form {...form}>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								void form.handleSubmit(onSubmit)(e);
							}}
						>
							<VetClinicContactInformation control={form.control} />

							<Separator className="my-4" />

							<VetClinicToVetRelationships
								control={form.control}
								existingVetToVetClinicRelationships={vetClinic?.vetToVetClinicRelationships}
								isLoading={isLoadingRelationships}
							/>

							<Separator className="my-4" />

							<SheetFooter>
								<SheetClose asChild>
									<Button variant="outline">Cancel</Button>
								</SheetClose>
								<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}>
									{form.formState.isSubmitting && <Loader size="sm" />}
									{isNew ? "Create" : "Update"} vet clinic
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		</>
	);
}

export { type ManageVetClinicSheetFormSchema, type ExistingVetClinic, ManageVetClinicSheet };
