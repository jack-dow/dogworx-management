"use client";

import * as React from "react";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions, type DogsList } from "~/actions";
import { DOGS_SORTABLE_COLUMNS } from "~/actions/sortable-columns";
import { createDogsTableColumns } from "./dogs-table-columns";

function DogsTable({ result }: { result: DogsList }) {
	const { toast } = useToast();

	const [confirmDogDelete, setConfirmDogDelete] = React.useState<DogsList["data"][number] | null>(null);

	return (
		<>
			<DestructiveActionDialog
				open={!!confirmDogDelete}
				onOpenChange={() => {
					setConfirmDogDelete(null);
				}}
				title="Are you sure?"
				description="This action will permanently delete this dog and any associated relationships. This action cannot be undone."
				actionText="Delete dog"
				onConfirm={async () => {
					if (confirmDogDelete == null) return;

					const result = await actions.app.dogs.delete(confirmDogDelete.id);

					if (result.success) {
						toast({
							title: `Dog deleted`,
							description: `Successfully deleted dog "${confirmDogDelete.givenName}"`,
						});
					} else {
						toast({
							title: `Dog deletion failed`,
							description: `There was an error deleting dog "${confirmDogDelete.givenName}". Please try again.`,
						});
					}
				}}
			/>

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await actions.app.dogs.search(searchTerm);

						if (!result.success) {
							throw new Error("Failed to search dogs");
						}

						return result.data;
					},
					renderSearchResultItemText: (dog) => `${dog.givenName}`,
				}}
				columns={createDogsTableColumns((dog) => {
					setConfirmDogDelete(dog);
				})}
				sortableColumns={DOGS_SORTABLE_COLUMNS}
				{...result}
			/>
		</>
	);
}

export { DogsTable };
