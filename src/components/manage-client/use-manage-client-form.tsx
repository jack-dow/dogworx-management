"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { actions, type ClientById, type ClientInsert, type ClientUpdate } from "~/actions";
import { InsertClientSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { EmailOrPhoneNumberSchema } from "~/lib/validation";
import { generateId, hasTrueValue, mergeRelationships } from "~/utils";

const ManageClientFormSchema = z.intersection(
	InsertClientSchema.extend({
		givenName: z.string().max(50).nonempty({ message: "Required" }),
		familyName: z.string().max(50).or(z.literal("")).optional(),
		streetAddress: z.string().max(255).optional(),
		city: z.string().max(50).optional(),
		state: z.string().max(50).optional(),
		postalCode: z.string().max(10).optional(),
		notes: z.string().max(100000).nullish(),
	}),
	EmailOrPhoneNumberSchema,
);
type ManageClientFormSchema = z.infer<typeof ManageClientFormSchema>;

type UseManageClientFormProps = {
	client?: ClientById;
	defaultValues?: Partial<ManageClientFormSchema>;
	onSubmit?: (
		data: ManageClientFormSchema,
	) => Promise<{ success: boolean; data: ClientInsert | ClientUpdate | null | undefined }>;
};

function useManageClientForm(props: UseManageClientFormProps) {
	const isNew = !props.client;

	const router = useRouter();
	const searchParams = useSearchParams();

	const { toast } = useToast();

	const searchTerm = searchParams.get("searchTerm") ?? "";

	const form = useForm<ManageClientFormSchema>({
		resolver: zodResolver(ManageClientFormSchema),
		defaultValues: {
			id: generateId(),
			givenName: searchTerm.split(" ").length === 1 ? searchTerm : searchTerm?.split(" ").slice(0, -1).join(" "),
			familyName: searchTerm.split(" ").length > 1 ? searchTerm?.split(" ").pop() : undefined,
			...props.client,
			...props.defaultValues,
			actions: {
				dogToClientRelationships: {},
			},
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	React.useEffect(() => {
		if (searchParams.get("searchTerm")) {
			router.replace("/client/new");
		}
	}, [searchParams, router]);

	React.useEffect(() => {
		function syncClient(client: ClientById) {
			const actions = form.getValues("actions");
			form.reset(
				{
					...client,
					dogToClientRelationships: mergeRelationships(
						form.getValues("dogToClientRelationships"),
						client.dogToClientRelationships,
						actions.dogToClientRelationships,
					),
					actions,
				},
				{
					keepDirty: true,
					keepDirtyValues: true,
				},
			);
		}

		if (props.client) {
			syncClient(props.client);
		}
	}, [props.client, form, toast]);

	async function onSubmit(data: ManageClientFormSchema) {
		let success = false;
		let newClient: ClientUpdate | ClientInsert | null | undefined;

		if (props.onSubmit) {
			const response = await props.onSubmit(data);
			success = response.success;
			newClient = response.data;
			return { success, data: newClient };
		} else if (props.client) {
			const response = await actions.app.clients.update(data);
			success = response.success && !!response.data;
			newClient = response.data;
		} else {
			const response = await actions.app.clients.insert(data);
			success = response.success;
			newClient = response.data;
		}

		if (success) {
			toast({
				title: `Client ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} client "${data.givenName}${
					data.familyName ? " " + data.familyName : ""
				}".`,
			});
		} else {
			toast({
				title: `Client ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} client "${data.givenName}${
					data.familyName ? " " + data.familyName : ""
				}". Please try again.`,
				variant: "destructive",
			});
		}

		return { success, data: newClient };
	}

	return { form, onSubmit };
}

export { type ManageClientFormSchema, type UseManageClientFormProps, useManageClientForm };
