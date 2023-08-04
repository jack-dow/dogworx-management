"use client";

import * as React from "react";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions, type VetsList } from "~/actions";
import { VETS_SORTABLE_COLUMNS } from "~/actions/sortable-columns";
import { createVetsTableColumns } from "./vets-table-columns";

function VetsTable({ result }: { result: VetsList }) {
	const { toast } = useToast();

	const [confirmVetDelete, setConfirmVetDelete] = React.useState<VetsList["data"][number] | null>(null);

	return (
		<>
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
				search={{
					onSearch: async (searchTerm) => {
						const result = await actions.app.vets.search(searchTerm);

						if (!result.success) {
							throw new Error("Failed to search vets");
						}

						return result.data;
					},
					renderSearchResultItemText: (vet) => `${vet.givenName} ${vet.familyName}`,
				}}
				columns={createVetsTableColumns((vet) => {
					setConfirmVetDelete(vet);
				})}
				sortableColumns={VETS_SORTABLE_COLUMNS}
				{...result}
			/>
		</>
	);
}

export { VetsTable };
