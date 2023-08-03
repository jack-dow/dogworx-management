"use client";

import * as React from "react";

import { ManageVetClinicSheet } from "~/components/manage-vet-clinic-sheet";
import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions, type VetClinicsList } from "~/actions";
import { VET_CLINICS_SORTABLE_COLUMNS } from "~/actions/sortable-columns";
import { createVetClinicsTableColumns } from "./vet-clinics-table-columns";

function VetClinicsTable({ result }: { result: VetClinicsList }) {
	const { toast } = useToast();

	const [confirmClientDelete, setConfirmClientDelete] = React.useState<VetClinicsList["data"][number] | null>(null);
	const [isCreateVetClinicSheetOpen, setIsCreateVetClinicSheetOpen] = React.useState<string | null>(null);

	return (
		<>
			<DestructiveActionDialog
				open={!!confirmClientDelete}
				onOpenChange={() => {
					setConfirmClientDelete(null);
				}}
				title="Are you sure?"
				description="This action will permanently delete this vet clinic and any associated relationships. This action cannot be undone."
				actionText="Delete vet clinic"
				onConfirm={async () => {
					if (confirmClientDelete == null) return;

					const result = await actions.app.vetClinics.delete(confirmClientDelete.id);

					if (result.success) {
						toast({
							title: `Client deleted`,
							description: `Successfully deleted vet clinic "${confirmClientDelete.name}"`,
						});
					} else {
						toast({
							title: `Client deletion failed`,
							description: `There was an error deleting vet clinic "${confirmClientDelete.name}". Please try again.`,
						});
					}
				}}
			/>

			{isCreateVetClinicSheetOpen && (
				<ManageVetClinicSheet
					open={!!isCreateVetClinicSheetOpen}
					setOpen={() => {
						setIsCreateVetClinicSheetOpen(null);
					}}
					defaultValues={{
						name: isCreateVetClinicSheetOpen,
					}}
					withoutTrigger
				/>
			)}

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await actions.app.vetClinics.search(searchTerm);

						if (!result.success) {
							throw new Error("Failed to search vet clinic");
						}

						return result.data;
					},
					renderSearchResultItemText: (vetClinic) => `${vetClinic.name}`,
					onNoResultsActionSelect: (searchTerm) => {
						setIsCreateVetClinicSheetOpen(searchTerm);
					},
				}}
				columns={createVetClinicsTableColumns((vetClinic) => {
					setConfirmClientDelete(vetClinic);
				})}
				sortableColumns={VET_CLINICS_SORTABLE_COLUMNS}
				{...result}
			/>
		</>
	);
}

export { VetClinicsTable };
