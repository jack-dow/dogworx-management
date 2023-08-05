"use client";

import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { actions } from "~/actions";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageVetClinicFormSchemaType } from "./manage-vet-clinic";

function VetClinicDeleteDialog() {
	const form = useFormContext<ManageVetClinicFormSchemaType>();
	const router = useRouter();
	const { toast } = useToast();
	return (
		<DestructiveActionDialog
			name="vet clinic"
			onConfirm={async () => {
				const result = await actions.app.vetClinics.delete(form.getValues("id"));

				if (result.success) {
					toast({
						title: `Vet clinic deleted`,
						description: `Successfully deleted vet clinic "${form.getValues("name")}"`,
					});
					router.push("/vetClinics");
				} else {
					toast({
						title: `Vet clinic deletion failed`,
						description: `There was an error deleting vetClinic "${form.getValues("name")}". Please try again.`,
					});
				}
			}}
		/>
	);
}

export { VetClinicDeleteDialog };
