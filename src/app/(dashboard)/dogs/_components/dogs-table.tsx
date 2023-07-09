"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { api, type DogsList } from "~/api";
import { createDogsTableColumns } from "./dogs-table-columns";

function DogsTable({ dogs }: { dogs: DogsList }) {
	const router = useRouter();
	const { toast } = useToast();

	const [confirmDogDelete, setConfirmDogDelete] = React.useState<DogsList[number] | null>(null);

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

					const result = await api.dogs.delete(confirmDogDelete.id);

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
				data={dogs}
				columns={createDogsTableColumns((dog) => {
					setConfirmDogDelete(dog);
				})}
				onTableRowClick={(dog) => {
					router.push(`/dogs/${dog.id}`);
				}}
				filterInputPlaceholder="Filter dogs..."
			/>
		</>
	);
}

export { DogsTable };
