"use client";

import * as React from "react";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions, type VetClinicsList } from "~/actions";
import { VET_CLINICS_SORTABLE_COLUMNS } from "~/actions/sortable-columns";
import { createVetClinicsTableColumns } from "./vet-clinics-table-columns";

function VetClinicsTable({ result }: { result: VetClinicsList }) {
	const { toast } = useToast();

	const [confirmVetClinicDelete, setConfirmVetClinicDelete] = React.useState<VetClinicsList["data"][number] | null>(
		null,
	);

	return (
		<>
			<DestructiveActionDialog
				name="vet clinic"
				withoutTrigger
				open={!!confirmVetClinicDelete}
				onOpenChange={() => {
					setConfirmVetClinicDelete(null);
				}}
				onConfirm={async () => {
					if (confirmVetClinicDelete == null) return;

					const result = await actions.app.vetClinics.delete(confirmVetClinicDelete.id);

					if (result.success) {
						toast({
							title: `Vet clinic deleted`,
							description: `Successfully deleted vet clinic "${confirmVetClinicDelete.name}".`,
						});
					} else {
						toast({
							title: `Vet clinic deletion failed`,
							description: `There was an error deleting vet clinic "${confirmVetClinicDelete.name}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await actions.app.vetClinics.search(searchTerm);

						if (!result.success) {
							throw new Error("Failed to search vet clinics");
						}

						return result.data;
					},
					resultLabel: (vetClinic) => `${vetClinic.name}`,
				}}
				columns={createVetClinicsTableColumns((vetClinic) => {
					setConfirmVetClinicDelete(vetClinic);
				})}
				sortableColumns={VET_CLINICS_SORTABLE_COLUMNS}
				{...result}
			/>
		</>
	);
}

export { VetClinicsTable };
