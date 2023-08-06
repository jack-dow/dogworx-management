"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "~/components/ui/form";
import { useToast } from "~/components/ui/use-toast";
import { actions, type VetById, type VetInsert, type VetUpdate } from "~/actions";
import {
	InsertDogToVetRelationshipSchema,
	InsertVetSchema,
	InsertVetToVetClinicRelationshipSchema,
	SelectDogSchema,
	SelectVetClinicSchema,
} from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { EmailOrPhoneNumberSchema } from "~/lib/validation";
import { generateId, hasTrueValue, mergeRelationships } from "~/utils";
import { ManageVetForm, type ManageVetFormProps } from "./manage-vet-form";
import { ManageVetSheet, type ManageVetSheetProps } from "./manage-vet-sheet";

const ManageVetFormSchema = z.intersection(
	InsertVetSchema.extend({
		givenName: z.string().max(50).nonempty({ message: "Required" }),
		familyName: z.string().max(50).or(z.literal("")).optional(),
		notes: z.string().max(100000).nullish(),
		dogToVetRelationships: z.array(
			InsertDogToVetRelationshipSchema.extend({
				dog: SelectDogSchema.pick({
					id: true,
					givenName: true,
					color: true,
					breed: true,
				}),
			}),
		),
		vetToVetClinicRelationships: z.array(
			InsertVetToVetClinicRelationshipSchema.extend({
				vetClinic: SelectVetClinicSchema.pick({
					id: true,
					name: true,
					emailAddress: true,
					phoneNumber: true,
				}),
			}),
		),
	}),
	EmailOrPhoneNumberSchema,
);
// Had to add `Type` suffix because was getting "Cannot access before initialization" error
type ManageVetFormSchemaType = z.infer<typeof ManageVetFormSchema>;

type ManageVetProps<
	VariantType extends "sheet" | "form",
	VetProp extends VetById | undefined,
> = VariantType extends "sheet"
	? Omit<ManageVetSheetProps<VetProp>, "onSubmit"> & { variant: VariantType }
	: Omit<ManageVetFormProps, "onSubmit"> & { variant: VariantType };

function ManageVet<VariantType extends "sheet" | "form", VetProp extends VetById | undefined>(
	props: ManageVetProps<VariantType, VetProp>,
) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isNew = !props.vet;

	const { toast } = useToast();

	const searchTerm = searchParams.get("searchTerm") ?? "";

	const form = useForm<ManageVetFormSchemaType>({
		resolver: zodResolver(ManageVetFormSchema),
		defaultValues: {
			id: props.vet?.id || props.defaultValues?.id || generateId(),
			givenName: searchTerm.split(" ").length === 1 ? searchTerm : searchTerm?.split(" ").slice(0, -1).join(" "),
			familyName: searchTerm.split(" ").length > 1 ? searchTerm?.split(" ").pop() : undefined,
			dogToVetRelationships: props.vet?.dogToVetRelationships,
			vetToVetClinicRelationships: props.vet?.vetToVetClinicRelationships ?? [],
			...props.vet,
			...props.defaultValues,
			actions: {
				dogToVetRelationships: {},
				vetToVetClinicRelationships: {},
			},
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	React.useEffect(() => {
		if (searchParams.get("searchTerm")) {
			router.replace("/vet/new");
		}
	}, [searchParams, router]);

	React.useEffect(() => {
		if (props.vet) {
			const actions = form.getValues("actions");
			form.reset(
				{
					...props.vet,
					vetToVetClinicRelationships: mergeRelationships(
						form.getValues("vetToVetClinicRelationships"),
						props.vet.vetToVetClinicRelationships ?? [],
						actions.vetToVetClinicRelationships,
					),
					dogToVetRelationships: mergeRelationships(
						form.getValues("dogToVetRelationships"),
						props.vet?.dogToVetRelationships ?? [],
						actions.dogToVetRelationships,
					),
					actions,
				},
				{
					keepDirty: true,
					keepDirtyValues: true,
				},
			);
		}
	}, [props.vet, form]);

	async function onSubmit(data: ManageVetFormSchemaType) {
		let success = false;
		let newVet: VetUpdate | VetInsert | null | undefined;

		if (props.vet) {
			const response = await actions.app.vets.update(data);
			success = response.success && !!response.data;
			newVet = response.data;
		} else {
			const response = await actions.app.vets.insert(data);
			success = response.success;
			newVet = response.data;
		}

		if (success) {
			toast({
				title: `Vet ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} vet "${data.givenName}${
					data.familyName ? " " + data.familyName : ""
				}"`,
			});
		} else {
			toast({
				title: `Vet ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} vet "${data.givenName}${
					data.familyName ? " " + data.familyName : ""
				}". Please try again later.`,
			});
		}

		return { success, data: newVet };
	}

	return (
		<Form {...form}>
			{props.variant === "sheet" ? (
				<ManageVetSheet {...props} onSubmit={onSubmit} />
			) : (
				<ManageVetForm {...props} onSubmit={onSubmit} />
			)}
		</Form>
	);
}

export { type ManageVetFormSchemaType, ManageVet };
