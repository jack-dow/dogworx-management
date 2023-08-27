"use client";

import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { actions } from "~/actions";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageVetClinicFormSchema } from "./use-manage-vet-clinic-form";

function VetClinicDeleteDialog() {
	const { toast } = useToast();

	const router = useRouter();

	const form = useFormContext<ManageVetClinicFormSchema>();

	return (
		<DestructiveActionDialog
			name="vet clinic"
			onConfirm={async () => {
				const result = await actions.app.vetClinics.delete(form.getValues("id"));

				if (result.success) {
					toast({
						title: `Vet clinic deleted`,
						description: `Successfully deleted vet clinic "${form.getValues("name")}".`,
					});
					router.push("/vetClinics");
				} else {
					toast({
						title: `Vet clinic deletion failed`,
						description: `There was an error deleting vetClinic "${form.getValues("name")}". Please try again.`,
						variant: "destructive",
					});
				}
			}}
		/>
	);
}

export { VetClinicDeleteDialog };
