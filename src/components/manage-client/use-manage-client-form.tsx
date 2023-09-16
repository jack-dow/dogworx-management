"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { InsertClientSchema } from "~/db/validation/app";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { EmailOrPhoneNumberSchema, generateId, hasTrueValue, logInDevelopment } from "~/lib/client-utils";
import { api } from "~/lib/trpc/client";
import { type RouterOutputs } from "~/server";

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
	client?: RouterOutputs["app"]["clients"]["byId"]["data"];
	defaultValues?: Partial<ManageClientFormSchema>;
	onSubmit?: (data: ManageClientFormSchema) => Promise<void>;
	onSuccessfulSubmit?: (data: ManageClientFormSchema) => void;
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
			givenName: searchTerm.split(" ").length === 1 ? searchTerm : searchTerm?.split(" ").slice(0, -1).join(" "),
			familyName: searchTerm.split(" ").length > 1 ? searchTerm?.split(" ").pop() : undefined,
			dogToClientRelationships: [],
			...props.client,
			...props.defaultValues,
			id: props.client?.id ?? generateId(),
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	const insertMutation = api.app.clients.insert.useMutation();
	const updateMutation = api.app.clients.update.useMutation();

	React.useEffect(() => {
		if (searchParams.get("searchTerm")) {
			router.replace("/clients/new");
		}
	}, [searchParams, router]);

	React.useEffect(() => {
		if (props.client) {
			form.reset(props.client, {
				keepDirty: true,
				keepDirtyValues: true,
			});
		}
	}, [props.client, form, toast]);

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
					title: `Client ${isNew ? "Created" : "Updated"}`,
					description: `Successfully ${isNew ? "created" : "updated"} client "${data.givenName}${
						data.familyName ? " " + data.familyName : ""
					}".`,
				});
				props.onSuccessfulSubmit?.(data);
			} catch (error) {
				logInDevelopment(error);

				toast({
					title: `Client ${isNew ? "Creation" : "Update"} Failed`,
					description: `There was an error ${isNew ? "creating" : "updating"} client "${data.givenName}${
						data.familyName ? " " + data.familyName : ""
					}". Please try again.`,
					variant: "destructive",
				});
			}
		})(e);
	}

	return { form, onSubmit };
}

export { type ManageClientFormSchema, type UseManageClientFormProps, useManageClientForm };
