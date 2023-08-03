"use client";

import * as React from "react";

import { ManageClientSheet } from "~/components/manage-client-sheet";
import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions, type ClientsList } from "~/actions";
import { CLIENTS_SORTABLE_COLUMNS } from "~/actions/sortable-columns";
import { createClientsTableColumns } from "./clients-table-columns";

function ClientsTable({ result }: { result: ClientsList }) {
	const { toast } = useToast();

	const [confirmClientDelete, setConfirmClientDelete] = React.useState<ClientsList["data"][number] | null>(null);
	const [isCreateClientSheetOpen, setIsCreateClientSheetOpen] = React.useState<string | null>(null);

	return (
		<>
			<DestructiveActionDialog
				open={!!confirmClientDelete}
				onOpenChange={() => {
					setConfirmClientDelete(null);
				}}
				title="Are you sure?"
				description="This action will permanently delete this client and any associated relationships. This action cannot be undone."
				actionText="Delete client"
				onConfirm={async () => {
					if (confirmClientDelete == null) return;

					const result = await actions.app.clients.delete(confirmClientDelete.id);

					if (result.success) {
						toast({
							title: `Client deleted`,
							description: `Successfully deleted client "${confirmClientDelete.givenName}${
								confirmClientDelete.familyName ? " " + confirmClientDelete.familyName : ""
							}"`,
						});
					} else {
						toast({
							title: `Client deletion failed`,
							description: `There was an error deleting client "${confirmClientDelete.givenName}${
								confirmClientDelete.familyName ? " " + confirmClientDelete.familyName : ""
							}". Please try again.`,
						});
					}
				}}
			/>

			{isCreateClientSheetOpen && (
				<ManageClientSheet
					open={!!isCreateClientSheetOpen}
					setOpen={() => {
						setIsCreateClientSheetOpen(null);
					}}
					defaultValues={{
						givenName:
							isCreateClientSheetOpen.split(" ").length === 1
								? isCreateClientSheetOpen
								: isCreateClientSheetOpen?.split(" ").slice(0, -1).join(" "),

						familyName:
							isCreateClientSheetOpen.split(" ").length > 1 ? isCreateClientSheetOpen?.split(" ").pop() : undefined,
					}}
					withoutTrigger
				/>
			)}

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await actions.app.clients.search(searchTerm);

						if (!result.success) {
							throw new Error("Failed to search clients");
						}

						return result.data;
					},
					renderSearchResultItemText: (client) => `${client.givenName} ${client.familyName}`,
					onNoResultsActionSelect: (searchTerm) => {
						setIsCreateClientSheetOpen(searchTerm);
					},
				}}
				columns={createClientsTableColumns((client) => {
					setConfirmClientDelete(client);
				})}
				sortableColumns={CLIENTS_SORTABLE_COLUMNS}
				{...result}
			/>
		</>
	);
}

export { ClientsTable };
