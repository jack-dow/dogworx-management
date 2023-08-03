"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { actions, type ClientById, type ClientInsert, type ClientUpdate } from "~/actions";
import { InsertClientSchema, InsertDogToClientRelationshipSchema, SelectDogSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { EmailOrPhoneNumberSchema } from "~/lib/validation";
import { generateId, mergeRelationships } from "~/utils";
import { Form } from "../ui/form";
import { ManageClientForm, type ManageClientFormProps } from "./manage-client-form";
import { ManageClientSheet, type ManageClientSheetProps } from "./manage-client-sheet";

const ManageClientFormSchema = z.intersection(
	InsertClientSchema.extend({
		givenName: z.string().max(50).nonempty({ message: "Required" }),
		familyName: z.string().max(50).or(z.literal("")).optional(),
		streetAddress: z.string().max(255).optional(),
		city: z.string().max(50).optional(),
		state: z.string().max(50).optional(),
		postalCode: z.string().max(10).optional(),
		notes: z.string().max(100000).nullish(),
		dogToClientRelationships: z.array(
			InsertDogToClientRelationshipSchema.extend({
				dog: SelectDogSchema.pick({
					id: true,
					givenName: true,
					color: true,
				}),
			}),
		),
	}),
	EmailOrPhoneNumberSchema,
);
type ManageClientFormSchema = z.infer<typeof ManageClientFormSchema>;

type ManageClientProps<
	FormType extends "sheet" | "form",
	ClientProp extends ClientById | undefined,
> = FormType extends "sheet"
	? Omit<ManageClientSheetProps<ClientProp>, "onSubmit"> & { type: FormType }
	: Omit<ManageClientFormProps, "onSubmit"> & { type: FormType };

function ManageClient<FormType extends "sheet" | "form", ClientProp extends ClientById | undefined>(
	props: ManageClientProps<FormType, ClientProp>,
) {
	const isNew = !props.client;

	const { toast } = useToast();

	const form = useForm<ManageClientFormSchema>({
		resolver: zodResolver(ManageClientFormSchema),
		defaultValues: {
			id: props.client?.id || props.defaultValues?.id || generateId(),
			...props.client,
			...props.defaultValues,
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
						client.dogToClientRelationships,
						actions.dogToClientRelationships,
					),
					actions,
				},
				{
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

		if (props.client) {
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
				}"`,
			});
		} else {
			toast({
				title: `Client ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} client "${data.givenName}${
					data.familyName ? " " + data.familyName : ""
				}". Please try again later.`,
			});
		}

		return { success, data: newClient };
	}

	return (
		<Form {...form}>
			{props.type === "sheet" ? (
				<ManageClientSheet {...props} onSubmit={onSubmit} />
			) : (
				<ManageClientForm {...props} onSubmit={onSubmit} />
			)}
		</Form>
	);
}

export { ManageClient, ManageClientFormSchema };
