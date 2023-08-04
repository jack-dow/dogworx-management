"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "~/components/ui/form";
import { useToast } from "~/components/ui/use-toast";
import { actions, type OrganizationById, type OrganizationInsert, type OrganizationUpdate } from "~/actions";
import { InsertOrganizationInviteLinkSchema, InsertOrganizationSchema, SelectUserSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { generateId } from "~/utils";
import { ManageOrganizationForm, type ManageOrganizationFormProps } from "./manage-organization-form";
import { ManageOrganizationSheet, type ManageOrganizationSheetProps } from "./manage-organization-sheet";

const ManageOrganizationFormSchema = InsertOrganizationSchema.extend({
	name: z.string().max(50).nonempty({ message: "Required" }),
	organizationInviteLinks: z.array(
		InsertOrganizationInviteLinkSchema.extend({
			user: SelectUserSchema.pick({
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				organizationRole: true,
				profileImageUrl: true,
			}),
		}),
	),
});
type ManageOrganizationFormSchema = z.infer<typeof ManageOrganizationFormSchema>;

type ManageOrganizationProps<
	VariantType extends "sheet" | "form",
	OrganizationProp extends OrganizationById | undefined,
> = VariantType extends "sheet"
	? Omit<ManageOrganizationSheetProps<OrganizationProp>, "onSubmit"> & { variant: VariantType }
	: Omit<ManageOrganizationFormProps, "onSubmit"> & { variant: VariantType };

function ManageOrganization<
	VariantType extends "sheet" | "form",
	OrganizationProp extends OrganizationById | undefined,
>(props: ManageOrganizationProps<VariantType, OrganizationProp>) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isNew = !props.organization;

	const { toast } = useToast();

	const searchTerm = searchParams.get("searchTerm") ?? "";

	const form = useForm<ManageOrganizationFormSchema>({
		resolver: zodResolver(ManageOrganizationFormSchema),
		defaultValues: {
			id: generateId(),
			name: searchTerm,
			maxUsers: 5,
			...props.organization,
			...props.defaultValues,
			actions: {
				organizationInviteLinks: {},
			},
		},
	});
	useConfirmPageNavigation(form.formState.isDirty);

	React.useEffect(() => {
		if (searchParams.get("searchTerm")) {
			router.replace("/organization/new");
		}
	}, [searchParams, router]);

	React.useEffect(() => {
		function syncOrganization(organization: OrganizationById) {
			const actions = form.getValues("actions");
			form.reset(
				{ ...organization, actions },
				{
					keepDirtyValues: true,
				},
			);
		}

		if (props.organization) {
			syncOrganization(props.organization);
		}
	}, [props.organization, form, toast]);

	async function onSubmit(data: ManageOrganizationFormSchema) {
		let success = false;
		let newOrganization: OrganizationUpdate | OrganizationInsert | null | undefined;

		if (props.organization) {
			const response = await actions.auth.organizations.update(data);
			success = response.success && !!response.data;
			newOrganization = response.data;
		} else {
			const response = await actions.auth.organizations.insert(data);
			success = response.success;
			newOrganization = response.data;
		}

		if (success) {
			toast({
				title: `Organization ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} organization "${data.name}"`,
			});
		} else {
			toast({
				title: `Organization ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} organization "${
					data.name
				}". Please try again later.`,
			});
		}

		return { success, data: newOrganization };
	}

	return (
		<Form {...form}>
			{props.variant === "sheet" ? (
				<ManageOrganizationSheet {...props} onSubmit={onSubmit} />
			) : (
				<ManageOrganizationForm {...props} onSubmit={onSubmit} />
			)}
		</Form>
	);
}

export { ManageOrganizationFormSchema, ManageOrganization };
