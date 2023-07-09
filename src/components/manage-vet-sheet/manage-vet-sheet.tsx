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
	InsertDogToVetRelationshipSchema,
	InsertVetSchema,
	InsertVetToVetClinicRelationshipSchema,
	SelectDogSchema,
	SelectVetSchema,
	type VetInsert,
	type VetsList,
	type VetsSearch,
	type VetUpdate,
} from "~/api";
import { prettyStringValidationMessage } from "~/lib/validations/utils";
import { VetContactInformation } from "./vet-contact-information";

const ManageVetSheetFormSchema = InsertVetSchema.extend({
	name: prettyStringValidationMessage("Name", 2, 50),
	emailAddress: prettyStringValidationMessage("Email address", 1, 75).email({
		message: "Email address must be a valid email",
	}),
	phoneNumber: prettyStringValidationMessage("Phone number", 9, 16),
	notes: prettyStringValidationMessage("Notes", 0, 500).nullish(),
	dogToVetRelationships: z.array(InsertDogToVetRelationshipSchema.extend({ dog: SelectDogSchema })),
	vetToVetClinicRelationships: z.array(InsertVetToVetClinicRelationshipSchema.extend({ vet: SelectVetSchema })),
});
type ManageVetSheetFormSchema = z.infer<typeof ManageVetSheetFormSchema>;

type DefaultValues = Partial<ManageVetSheetFormSchema>;
type ExistingVet = VetsList[number] | VetsSearch[number];

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

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const form = useForm<ManageVetSheetFormSchema>({
		resolver: zodResolver(ManageVetSheetFormSchema),
		defaultValues: {
			id: vet?.id || defaultValues?.id || generateId(),
			dogToVetRelationships: vet?.dogToVetRelationships,
			vetToVetClinicRelationships: vet?.vetToVetClinicRelationships,
			...vet,
			...defaultValues,
			actions: {
				dogToVetRelationships: {},
				vetToVetClinicRelationships: {},
			},
		},
	});

	React.useEffect(() => {
		form.reset(vet, {
			keepDirtyValues: true,
		});
	}, [vet, form]);

	async function onSubmit(data: ManageVetSheetFormSchema) {
		let success = false;
		let newVet: VetUpdate | VetInsert | undefined;

		if (vet) {
			const response = await api.vets.update(data);
			success = response.success && !!response.data;
			newVet = response.data;
		} else {
			const response = await api.vets.insert(data);
			success = response.success;
			newVet = response.data;
		}

		if (success) {
			if (newVet && onSuccessfulSubmit) {
				onSuccessfulSubmit(newVet);
			}

			toast({
				title: `Vet ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} vet "${data.name}"`,
			});

			setInternalOpen(false);
			form.reset();
		} else {
			toast({
				title: `Vet ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} vet "${
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

							{/* <ClientDogRelationships control={form.control} /> */}

							{/* Separator is in ClientDogRelationships due to its dynamic-ness */}

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

export { type ManageVetSheetFormSchema, ManageVetSheet };
