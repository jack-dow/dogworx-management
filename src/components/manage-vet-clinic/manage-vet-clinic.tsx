"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "~/components/ui/form";
import { useToast } from "~/components/ui/use-toast";
import { actions, type VetClinicById, type VetClinicInsert, type VetClinicUpdate } from "~/actions";
import { InsertVetClinicSchema, InsertVetToVetClinicRelationshipSchema, SelectVetSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { EmailOrPhoneNumberSchema } from "~/lib/validation";
import { generateId, mergeRelationships } from "~/utils";
import { ManageVetClinicForm, type ManageVetClinicFormProps } from "./manage-vet-clinic-form";
import { ManageVetClinicSheet, type ManageVetClinicSheetProps } from "./manage-vet-clinic-sheet";

const ManageVetClinicFormSchema = z.intersection(
	InsertVetClinicSchema.extend({
		name: z.string().max(50).nonempty({ message: "Required" }),
		notes: z.string().max(100000).nullish(),
		vetToVetClinicRelationships: z.array(
			InsertVetToVetClinicRelationshipSchema.extend({
				vet: SelectVetSchema.pick({
					id: true,
					givenName: true,
					familyName: true,
					emailAddress: true,
					phoneNumber: true,
				}),
			}),
		),
	}),
	EmailOrPhoneNumberSchema,
);
type ManageVetClinicFormSchema = z.infer<typeof ManageVetClinicFormSchema>;

type ManageVetClinicProps<
	VariantType extends "sheet" | "form",
	VetClinicProp extends VetClinicById | undefined,
> = VariantType extends "sheet"
	? Omit<ManageVetClinicSheetProps<VetClinicProp>, "onSubmit"> & { variant: VariantType }
	: Omit<ManageVetClinicFormProps, "onSubmit"> & { variant: VariantType };

function ManageVetClinic<VariantType extends "sheet" | "form", VetClinicProp extends VetClinicById | undefined>(
	props: ManageVetClinicProps<VariantType, VetClinicProp>,
) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isNew = !props.vetClinic;

	const { toast } = useToast();

	const searchTerm = searchParams.get("searchTerm") ?? "";

	const form = useForm<ManageVetClinicFormSchema>({
		resolver: zodResolver(ManageVetClinicFormSchema),
		defaultValues: {
			id: props.vetClinic?.id || props.defaultValues?.id || generateId(),
			name: searchTerm,
			...props.vetClinic,
			...props.defaultValues,
			actions: {
				vetToVetClinicRelationships: {},
			},
		},
	});
	useConfirmPageNavigation(form.formState.isDirty);

	React.useEffect(() => {
		if (searchParams.get("searchTerm")) {
			router.replace("/vet-clinics/new");
		}
	}, [searchParams, router]);

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

		if (props.vetClinic) {
			syncVetClinic(props.vetClinic);
		}
	}, [props.vetClinic, form]);

	async function onSubmit(data: ManageVetClinicFormSchema) {
		let success = false;
		let newVetClinic: VetClinicUpdate | VetClinicInsert | null | undefined;

		if (props.vetClinic) {
			const response = await actions.app.vetClinics.update(data);
			success = response.success && !!response.data;
			newVetClinic = response.data;
		} else {
			const response = await actions.app.vetClinics.insert(data);
			success = response.success;
			newVetClinic = response.data;
		}

		if (success) {
			toast({
				title: `Vet Clinic ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} vet clinic "${data.name}"`,
			});
		} else {
			toast({
				title: `Vet Clinic ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} vet clinic "${
					data.name
				}". Please try again later.`,
			});
		}

		return { success, data: newVetClinic };
	}

	return (
		<Form {...form}>
			{props.variant === "sheet" ? (
				<ManageVetClinicSheet {...props} onSubmit={onSubmit} />
			) : (
				<ManageVetClinicForm {...props} onSubmit={onSubmit} />
			)}
		</Form>
	);
}

export { ManageVetClinicFormSchema, ManageVetClinic };
