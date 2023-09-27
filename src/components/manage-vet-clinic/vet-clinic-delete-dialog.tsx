"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { api } from "~/lib/trpc/client";
import { logInDevelopment } from "~/lib/utils";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageVetClinicFormSchema } from "./use-manage-vet-clinic-form";

function VetClinicDeleteDialog({ onSuccessfulDelete }: { onSuccessfulDelete?: () => void }) {
	const router = useRouter();
	const pathname = usePathname();

	const form = useFormContext<ManageVetClinicFormSchema>();
	const { toast } = useToast();

	const deleteMutation = api.app.vetClinics.delete.useMutation();

	return (
		<DestructiveActionDialog
			name="vet clinic"
			onConfirm={async () => {
				try {
					await deleteMutation.mutateAsync({ id: form.getValues("id") });

					toast({
						title: `Vet clinic deleted`,
						description: `Successfully deleted vet clinic "${form.getValues("name")}".`,
					});

					if (pathname.startsWith("/vet-clinics/")) {
						router.push("/vet-clinics");
						return;
					}

					onSuccessfulDelete?.();
				} catch (error) {
					logInDevelopment(error);

					toast({
						title: `Vet clinic deletion failed`,
						description: `There was an error deleting vet clinic "${form.getValues("name")}". Please try again.`,
						variant: "destructive",
					});
				}
			}}
		/>
	);
}

export { VetClinicDeleteDialog };
