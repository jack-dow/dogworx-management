"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { api } from "~/lib/trpc/client";
import { logInDevelopment } from "~/lib/utils";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageVetFormSchema } from "./use-manage-vet-form";

function VetDeleteDialog({ onSuccessfulDelete }: { onSuccessfulDelete?: () => void }) {
	const router = useRouter();
	const pathname = usePathname();

	const form = useFormContext<ManageVetFormSchema>();
	const { toast } = useToast();

	const deleteMutation = api.app.vets.delete.useMutation();

	return (
		<DestructiveActionDialog
			name="vet"
			onConfirm={async () => {
				try {
					await deleteMutation.mutateAsync({ id: form.getValues("id") });

					toast({
						title: `Vet deleted`,
						description: `Successfully deleted vet "${form.getValues("givenName")}${
							form.getValues("familyName") ? " " + form.getValues("familyName") : ""
						}".`,
					});

					if (pathname.startsWith("/vets/")) {
						router.push("/vets");
						return;
					}

					onSuccessfulDelete?.();
				} catch (error) {
					logInDevelopment(error);

					toast({
						title: `Vet deletion failed`,
						description: `There was an error deleting vet "${form.getValues("givenName")}${
							form.getValues("familyName") ? " " + form.getValues("familyName") : ""
						}". Please try again.`,
						variant: "destructive",
					});
				}
			}}
		/>
	);
}

export { VetDeleteDialog };
