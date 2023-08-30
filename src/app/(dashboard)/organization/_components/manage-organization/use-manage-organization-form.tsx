"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { actions, type OrganizationById, type OrganizationInsert, type OrganizationUpdate } from "~/actions";
import { InsertOrganizationInviteLinkSchema, InsertOrganizationSchema, SelectUserSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { generateId, hasTrueValue } from "~/utils";

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

type UseManageOrganizationFormProps = {
	organization?: OrganizationById;
	defaultValues?: Partial<ManageOrganizationFormSchema>;
	onSubmit?: (
		data: ManageOrganizationFormSchema,
	) => Promise<{ success: boolean; data: OrganizationInsert | OrganizationUpdate | null | undefined }>;
};

function useManageOrganizationForm(props: UseManageOrganizationFormProps) {
	const isNew = !props.organization;

	const router = useRouter();
	const searchParams = useSearchParams();

	const { toast } = useToast();

	const searchTerm = searchParams.get("searchTerm") ?? "";

	const form = useForm<ManageOrganizationFormSchema>({
		resolver: zodResolver(ManageOrganizationFormSchema),
		defaultValues: {
			name: searchTerm,
			maxUsers: 5,
			...props.organization,
			...props.defaultValues,
			id: props.organization?.id ?? generateId(),
			actions: {
				organizationInviteLinks: {},
			},
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

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
					keepDirty: true,
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

		if (props.onSubmit) {
			const response = await props.onSubmit(data);
			success = response.success;
			newOrganization = response.data;
			return { success, data: newOrganization };
		} else if (props.organization) {
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
				description: `Successfully ${isNew ? "created" : "updated"} organization "${data.name}".`,
			});
		} else {
			toast({
				title: `Organization ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} organization "${
					data.name
				}". Please try again.`,
				variant: "destructive",
			});
		}

		return { success, data: newOrganization };
	}

	return {
		form,
		onSubmit,
	};
}

export { type ManageOrganizationFormSchema, type UseManageOrganizationFormProps, useManageOrganizationForm };
