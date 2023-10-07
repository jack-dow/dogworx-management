"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { InsertVetSchema } from "~/db/validation/app";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { useZodForm } from "~/hooks/use-zod-form";
import { api } from "~/lib/trpc/client";
import { EmailOrPhoneNumberSchema, generateId, hasTrueValue, logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

const ManageVetFormSchema = z.intersection(
	InsertVetSchema.extend({
		givenName: z.string().min(1, { message: "Required" }).max(50),
		familyName: z.string().max(50).or(z.literal("")).optional(),
		notes: z.string().max(100000).nullish(),
	}),
	EmailOrPhoneNumberSchema,
);
type ManageVetFormSchema = z.infer<typeof ManageVetFormSchema>;

type UseManageVetFormProps = {
	vet?: RouterOutputs["app"]["vets"]["byId"]["data"];
	defaultValues?: Partial<ManageVetFormSchema>;
	onSubmit?: (data: ManageVetFormSchema) => Promise<void>;
	onSuccessfulSubmit?: (data: ManageVetFormSchema) => void;
};

function useManageVetForm(props: UseManageVetFormProps) {
	const isNew = !props.vet;

	const router = useRouter();
	const searchParams = useSearchParams();

	const { toast } = useToast();

	const searchTerm = searchParams.get("searchTerm") ?? "";

	const result = api.app.vets.byId.useQuery(
		{ id: props.vet?.id ?? "new" },
		{ initialData: { data: props.vet }, enabled: !isNew },
	);
	const vet = result.data?.data;

	const form = useZodForm({
		schema: ManageVetFormSchema,
		defaultValues: {
			givenName: searchTerm.split(" ").length === 1 ? searchTerm : searchTerm?.split(" ").slice(0, -1).join(" "),
			familyName: searchTerm.split(" ").length > 1 ? searchTerm?.split(" ").pop() : undefined,
			dogToVetRelationships: [],
			vetToVetClinicRelationships: [],
			...props.defaultValues,
			...vet,
			id: vet?.id ?? generateId(),
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	const insertMutation = api.app.vets.insert.useMutation();
	const updateMutation = api.app.vets.update.useMutation();

	React.useEffect(() => {
		if (searchParams.get("searchTerm")) {
			router.replace("/vets/new");
		}
	}, [searchParams, router]);

	React.useEffect(() => {
		if (vet) {
			form.reset(vet, {
				keepDirty: true,
				keepDirtyValues: true,
			});
		}
	}, [vet, form]);

	function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		e.stopPropagation();

		void form.handleSubmit(async (data) => {
			try {
				if (props.onSubmit) {
					await props.onSubmit(data);
				} else if (isNew) {
					await insertMutation.mutateAsync(data);
				} else {
					await updateMutation.mutateAsync(data);
				}

				toast({
					title: `Vet ${isNew ? "Created" : "Updated"}`,
					description: `Successfully ${isNew ? "created" : "updated"} vet "${data.givenName}${
						data.familyName ? " " + data.familyName : ""
					}".`,
				});
				props.onSuccessfulSubmit?.(data);
			} catch (error) {
				logInDevelopment(error);

				toast({
					title: `Vet ${isNew ? "Creation" : "Update"} Failed`,
					description: `There was an error ${isNew ? "creating" : "updating"} vet "${data.givenName}${
						data.familyName ? " " + data.familyName : ""
					}". Please try again.`,
					variant: "destructive",
				});
			}
		})(e);
	}

	return { form, onSubmit };
}

export { type ManageVetFormSchema, type UseManageVetFormProps, useManageVetForm };
