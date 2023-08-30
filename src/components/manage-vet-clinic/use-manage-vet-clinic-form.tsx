"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { actions, type VetClinicById, type VetClinicInsert, type VetClinicUpdate } from "~/actions";
import { InsertVetClinicSchema, InsertVetToVetClinicRelationshipSchema, SelectVetSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { EmailOrPhoneNumberSchema } from "~/lib/validation";
import { generateId, hasTrueValue, mergeRelationships } from "~/utils";

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
// Had to add `Type` suffix because was getting "Cannot access before initialization" error
type ManageVetClinicFormSchema = z.infer<typeof ManageVetClinicFormSchema>;

type UseManageVetClinicFormProps = {
	vetClinic?: VetClinicById;
	defaultValues?: Partial<ManageVetClinicFormSchema>;
	onSubmit?: (
		data: ManageVetClinicFormSchema,
	) => Promise<{ success: boolean; data: VetClinicInsert | VetClinicUpdate | null | undefined }>;
};

function useManageVetClinicForm(props: UseManageVetClinicFormProps) {
	const isNew = !props.vetClinic;

	const router = useRouter();
	const searchParams = useSearchParams();

	const { toast } = useToast();

	const searchTerm = searchParams.get("searchTerm") ?? "";

	const form = useForm<ManageVetClinicFormSchema>({
		resolver: zodResolver(ManageVetClinicFormSchema),
		defaultValues: {
			name: searchTerm,
			...props.vetClinic,
			...props.defaultValues,
			id: props.vetClinic?.id ?? generateId(),
			actions: {
				vetToVetClinicRelationships: {},
			},
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	React.useEffect(() => {
		if (searchParams.get("searchTerm")) {
			router.replace("/vet-clinic/new");
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
					keepDirty: true,
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

		if (props.onSubmit) {
			const response = await props.onSubmit(data);
			success = response.success;
			newVetClinic = response.data;
			return { success, data: newVetClinic };
		} else if (props.vetClinic) {
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
				description: `Successfully ${isNew ? "created" : "updated"} vet clinic "${data.name}".`,
			});
		} else {
			toast({
				title: `Vet Clinic ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} vet clinic "${
					data.name
				}". Please try again.`,
				variant: "destructive",
			});
		}

		return { success, data: newVetClinic };
	}

	return { form, onSubmit };
}

export { type ManageVetClinicFormSchema, type UseManageVetClinicFormProps, useManageVetClinicForm };
