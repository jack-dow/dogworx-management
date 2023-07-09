"use client";

import * as React from "react";

import { ManageVetClinicSheet } from "~/components/manage-vet-clinic-sheet";
import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { api, type VetClinicsList } from "~/api";
import { createVetClinicsTableColumns } from "./vet-clinics-table-columns";

function VetClinicsTable({ vetClinics }: { vetClinics: VetClinicsList }) {
	const { toast } = useToast();

	const [editingVetClinic, setEditingVetClinic] = React.useState<VetClinicsList[number] | null>();
	const [confirmVetClinicDelete, setConfirmVetClinicDelete] = React.useState<VetClinicsList[number] | null>(null);

	return (
		<>
			<ManageVetClinicSheet
				withoutTrigger
				open={!!editingVetClinic}
				setOpen={() => {
					setEditingVetClinic(null);
				}}
				vetClinic={editingVetClinic ?? undefined}
			/>
			<DestructiveActionDialog
				open={!!confirmVetClinicDelete}
				onOpenChange={() => {
					setConfirmVetClinicDelete(null);
				}}
				title="Are you sure?"
				description="This action will permanently delete this vet clinic and any associated relationships. This action cannot be undone."
				actionText="Delete vet clinic"
				onConfirm={async () => {
					if (confirmVetClinicDelete == null) return;

					const result = await api.vetClinics.delete(confirmVetClinicDelete.id);

					if (result.success) {
						toast({
							title: `Vet deleted`,
							description: `Successfully deleted vet clinic "${confirmVetClinicDelete.name}"`,
						});
					} else {
						toast({
							title: `Vet deletion failed`,
							description: `There was an error deleting vet clinic "${confirmVetClinicDelete.name}". Please try again.`,
						});
					}
				}}
			/>

			<DataTable
				data={vetClinics}
				columns={createVetClinicsTableColumns((vetClinic) => {
					setConfirmVetClinicDelete(vetClinic);
				})}
				onTableRowClick={(vetClinic) => {
					setEditingVetClinic(vetClinic);
				}}
				filterInputPlaceholder="Filter vet clinics..."
			/>
		</>
	);
}

export { VetClinicsTable };
