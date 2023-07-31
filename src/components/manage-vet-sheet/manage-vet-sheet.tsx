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
	actions,
	type VetInsert,
	type VetRelationships,
	type VetsList,
	type VetsSearch,
	type VetUpdate,
} from "~/actions";
import {
	InsertDogToVetRelationshipSchema,
	InsertVetSchema,
	InsertVetToVetClinicRelationshipSchema,
	SelectDogSchema,
	SelectVetClinicSchema,
} from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { EmailOrPhoneNumberSchema } from "~/lib/validation";
import { generateId, mergeRelationships } from "~/utils";
import { VetContactInformation } from "./vet-contact-information";
import { VetToDogRelationships } from "./vet-to-dog-relationships";
import { VetToVetClinicRelationships } from "./vet-to-vet-clinic-relationships";

const ManageVetSheetFormSchema = z.intersection(
	InsertVetSchema.extend({
		givenName: z.string().max(50).nonempty({ message: "Required" }),
		familyName: z.string().max(50).or(z.literal("")).optional(),
		notes: z.string().max(100000).nullish(),
		dogToVetRelationships: z.array(InsertDogToVetRelationshipSchema.extend({ dog: SelectDogSchema })),
		vetToVetClinicRelationships: z.array(
			InsertVetToVetClinicRelationshipSchema.extend({ vetClinic: SelectVetClinicSchema }),
		),
	}),
	EmailOrPhoneNumberSchema,
);
type ManageVetSheetFormSchema = z.infer<typeof ManageVetSheetFormSchema>;

type DefaultValues = Partial<ManageVetSheetFormSchema>;
type ExistingVet = Omit<
	VetsList[number] | VetsSearch[number],
	"dogToVetRelationships" | "vetToVetClinicRelationships"
> &
	Partial<VetRelationships>;

type ManageVetSheetProps<VetProp extends ExistingVet | undefined> =
	| {
			open: boolean;
			setOpen: (open: boolean) => void;
			onSuccessfulSubmit?: (vet: VetProp extends ExistingVet ? VetUpdate : VetInsert) => void;
			vet?: VetProp;
			defaultValues?: DefaultValues;
			withoutTrigger?: boolean;
	  }
	| {
			open?: undefined;
			setOpen?: null;
			onSuccessfulSubmit?: (vet: VetProp extends ExistingVet ? VetUpdate : VetInsert) => void;
			vet?: VetProp;
			defaultValues?: DefaultValues;
			withoutTrigger?: boolean;
	  };

function ManageVetSheet<VetProp extends ExistingVet | undefined>({
	open,
	setOpen,
	onSuccessfulSubmit,
	withoutTrigger = false,
	vet,
	defaultValues,
}: ManageVetSheetProps<VetProp>) {
	const isNew = !vet;

	const { toast } = useToast();

	const [_open, _setOpen] = React.useState(open || false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);
	const [isLoadingRelationships, setIsLoadingRelationships] = React.useState(false);

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const form = useForm<ManageVetSheetFormSchema>({
		resolver: zodResolver(ManageVetSheetFormSchema),
		defaultValues: {
			id: vet?.id || defaultValues?.id || generateId(),
			dogToVetRelationships: vet?.dogToVetRelationships,
			vetToVetClinicRelationships: vet?.vetToVetClinicRelationships ?? [],
			...vet,
			...defaultValues,
			actions: {
				dogToVetRelationships: {},
				vetToVetClinicRelationships: {},
			},
		},
	});
	useConfirmPageNavigation(form.formState.isDirty);

	React.useEffect(() => {
		function syncVet(vet: ExistingVet) {
			const actions = form.getValues("actions");
			form.reset(
				{
					...vet,
					dogToVetRelationships: mergeRelationships(
						form.getValues("dogToVetRelationships"),
						vet?.dogToVetRelationships,
						actions.dogToVetRelationships,
					),
					vetToVetClinicRelationships: mergeRelationships(
						form.getValues("vetToVetClinicRelationships"),
						vet.vetToVetClinicRelationships,
						actions.vetToVetClinicRelationships,
					),
					actions,
				},
				{
					keepDirtyValues: true,
				},
			);
		}

		if (vet) {
			if (!vet.dogToVetRelationships || !vet.vetToVetClinicRelationships) {
				setIsLoadingRelationships(true);
				const fetchRelationships = async () => {
					const response = await actions.app.vets.getRelationships(vet.id);
					if (response.success) {
						syncVet({
							...vet,
							dogToVetRelationships: response.data.dogToVetRelationships,
							vetToVetClinicRelationships: response.data.vetToVetClinicRelationships,
						});
					} else {
						toast({
							title: "Failed to fetch vet relationships",
							description:
								"An unknown error occurred whilst trying to get this vet's relationships. Please try again later.",
						});
					}

					setIsLoadingRelationships(false);
				};
				void fetchRelationships();
			}

			syncVet(vet);
		}
	}, [vet, form, toast]);

	async function onSubmit(data: ManageVetSheetFormSchema) {
		let success = false;
		let newVet: VetUpdate | VetInsert | undefined;

		if (vet) {
			const response = await actions.app.vets.update(data);
			success = response.success && !!response.data;
			newVet = response.data;
		} else {
			const response = await actions.app.vets.insert(data);
			success = response.success;
			newVet = response.data;
		}

		if (success) {
			if (newVet && onSuccessfulSubmit) {
				onSuccessfulSubmit(newVet);
			}

			toast({
				title: `Vet ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} vet "${data.givenName}${
					data.familyName ? " " + data.familyName : ""
				}"`,
			});

			setInternalOpen(false);
			form.reset();
		} else {
			toast({
				title: `Vet ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} vet "${data.givenName}${
					data.familyName ? " " + data.familyName : ""
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
						<Button>Create Vet</Button>
					</SheetTrigger>
				)}
				<SheetContent className="w-full sm:max-w-md md:max-w-lg xl:max-w-xl">
					<SheetHeader>
						<SheetTitle>{isNew ? "Create" : "Update"} Vet</SheetTitle>
						<SheetDescription>
							Use this form to {isNew ? "create" : "update"} a vet. Click {isNew ? "create" : "update"} vet when
							you&apos;re finished.
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
							<VetContactInformation control={form.control} />

							<Separator className="my-4" />

							<VetToVetClinicRelationships
								control={form.control}
								existingVetToVetClinicRelationships={vet?.vetToVetClinicRelationships}
								isLoading={isLoadingRelationships}
							/>

							<Separator className="my-4" />

							<VetToDogRelationships control={form.control} isNew={isNew} isLoading={isLoadingRelationships} />

							<Separator className="my-4" />

							<SheetFooter>
								<SheetClose asChild>
									<Button variant="outline">Cancel</Button>
								</SheetClose>
								<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}>
									{form.formState.isSubmitting && <Loader size="sm" />}
									{isNew ? "Create" : "Update"} vet
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		</>
	);
}

export { type ManageVetSheetFormSchema, type ExistingVet, ManageVetSheet };
