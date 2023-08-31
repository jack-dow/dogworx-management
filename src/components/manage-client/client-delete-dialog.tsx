"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { actions } from "~/actions";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageClientFormSchema } from "./use-manage-client-form";

function ClientDeleteDialog({ setOpen }: { setOpen?: (open: boolean) => void }) {
	const router = useRouter();
	const pathname = usePathname();

	const form = useFormContext<ManageClientFormSchema>();
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
						}".`,
					});

					if (pathname.startsWith("/client/")) {
						router.push("/clients");
						return;
					}

					if (setOpen) {
						setOpen(false);
					}
				} else {
					toast({
						title: `Client deletion failed`,
						description: `There was an error deleting client "${form.getValues("givenName")}${
							form.getValues("familyName") ? " " + form.getValues("familyName") : ""
						}". Please try again.`,
						variant: "destructive",
					});
				}
			}}
		/>
	);
}

export { ClientDeleteDialog };
