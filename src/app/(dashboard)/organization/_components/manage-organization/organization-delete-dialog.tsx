"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions } from "~/actions";
import { type ManageOrganizationFormSchema } from "./use-manage-organization-form";

function OrganizationDeleteDialog({ setOpen }: { setOpen?: (open: boolean) => void }) {
	const router = useRouter();
	const pathname = usePathname();

	const { toast } = useToast();
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

					if (pathname.startsWith("/organization/")) {
						router.push("/organizations");
						return;
					}

					if (setOpen) {
						setOpen(false);
					}
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
