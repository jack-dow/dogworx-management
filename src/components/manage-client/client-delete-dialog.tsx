"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { api } from "~/lib/trpc/client";
import { logInDevelopment } from "~/lib/utils";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageClientFormSchema } from "./use-manage-client-form";

function ClientDeleteDialog({ onSuccessfulDelete }: { onSuccessfulDelete?: () => void }) {
	const router = useRouter();
	const pathname = usePathname();

	const form = useFormContext<ManageClientFormSchema>();
	const { toast } = useToast();

	const deleteMutation = api.app.clients.delete.useMutation();

	return (
		<DestructiveActionDialog
			name="client"
			trigger="trash"
			onConfirm={async () => {
				try {
					await deleteMutation.mutateAsync({ id: form.getValues("id") });

					toast({
						title: `Client deleted`,
						description: `Successfully deleted client "${form.getValues("givenName")}${
							form.getValues("familyName") ? " " + form.getValues("familyName") : ""
						}".`,
					});

					if (pathname.startsWith("/clients/")) {
						router.push("/clients");
						return;
					}

					onSuccessfulDelete?.();
				} catch (error) {
					logInDevelopment(error);

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
