"use client";

import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions } from "~/actions";
import { type ManageOrganizationFormSchema } from "./use-manage-organization-form";

function OrganizationDeleteDialog() {
	const { toast } = useToast();

	const router = useRouter();

	const form = useFormContext<ManageOrganizationFormSchema>();

	return (
		<DestructiveActionDialog
			name="organization"
			onConfirm={async () => {
				const result = await actions.auth.organizations.delete(form.getValues("id"));

				if (result.success) {
					toast({
						title: `Organization deleted`,
						description: `Successfully deleted organization "${form.getValues("name")}".`,
					});
					router.push("/organizations");
				} else {
					toast({
						title: `Organization deletion failed`,
						description: `There was an error deleting organization "${form.getValues("name")}". Please try again.`,
						variant: "destructive",
					});
				}
			}}
		/>
	);
}

export { OrganizationDeleteDialog };
