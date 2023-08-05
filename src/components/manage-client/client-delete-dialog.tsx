"use client";

import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { actions } from "~/actions";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageClientFormSchema } from "./manage-client";

function ClientDeleteDialog() {
	const form = useFormContext<ManageClientFormSchema>();
	const router = useRouter();
	const { toast } = useToast();
	return (
		<DestructiveActionDialog
			name="client"
			onConfirm={async () => {
				const result = await actions.app.clients.delete(form.getValues("id"));

				if (result.success) {
					toast({
						title: `Client deleted`,
						description: `Successfully deleted client "${form.getValues("givenName")}${
							form.getValues("familyName") ? " " + form.getValues("familyName") : ""
						}"`,
					});
					router.push("/clients");
				} else {
					toast({
						title: `Client deletion failed`,
						description: `There was an error deleting client "${form.getValues("givenName")}${
							form.getValues("familyName") ? " " + form.getValues("familyName") : ""
						}". Please try again.`,
					});
				}
			}}
		/>
	);
}

export { ClientDeleteDialog };
