"use client";

import * as React from "react";

import { ManageVetSheet } from "~/components/manage-vet-sheet";
import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions, type VetsList } from "~/actions";
import { createVetsTableColumns } from "./vets-table-columns";

function VetsTable({ vets }: { vets: VetsList }) {
	const { toast } = useToast();

	const [editingVet, setEditingVet] = React.useState<VetsList[number] | null>();
	const [confirmVetDelete, setConfirmVetDelete] = React.useState<VetsList[number] | null>(null);

	return (
		<>
			<ManageVetSheet
				withoutTrigger
				open={!!editingVet}
				setOpen={() => {
					setEditingVet(null);
				}}
				vet={editingVet ?? undefined}
			/>

			<DestructiveActionDialog
				open={!!confirmVetDelete}
				onOpenChange={() => {
					setConfirmVetDelete(null);
				}}
				title="Are you sure?"
				description="This action will permanently delete this vet and any associated relationships. This action cannot be undone."
				actionText="Delete vet"
				onConfirm={async () => {
					if (confirmVetDelete == null) return;

					const result = await actions.app.vets.delete(confirmVetDelete.id);

					if (result.success) {
						toast({
							title: `Vet deleted`,
							description: `Successfully deleted vet "${confirmVetDelete.givenName}${
								confirmVetDelete.familyName ? " " + confirmVetDelete.familyName : ""
							}"`,
						});
					} else {
						toast({
							title: `Vet deletion failed`,
							description: `There was an error deleting vet "${confirmVetDelete.givenName}${
								confirmVetDelete.familyName ? " " + confirmVetDelete.familyName : ""
							}". Please try again.`,
						});
					}
				}}
			/>

			<DataTable
				data={vets}
				columns={createVetsTableColumns((vet) => {
					setConfirmVetDelete(vet);
				})}
				onTableRowClick={(vet) => {
					setEditingVet(vet);
				}}
				filterInputPlaceholder="Filter vets..."
			/>
		</>
	);
}

export { VetsTable };
