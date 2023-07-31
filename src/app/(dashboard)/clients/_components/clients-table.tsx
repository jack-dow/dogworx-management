"use client";

import * as React from "react";

import { ManageClientSheet } from "~/components/manage-client-sheet/manage-client-sheet";
import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions, type ClientsList } from "~/actions";
import { CLIENTS_SORTABLE_COLUMNS } from "~/actions/sortable-columns";
import { createClientsTableColumns } from "./clients-table-columns";

function ClientsTable({ result }: { result: ClientsList }) {
	const { toast } = useToast();

	const [editingClient, setEditingClient] = React.useState<ClientsList["data"][number] | null>();
	const [confirmClientDelete, setConfirmClientDelete] = React.useState<ClientsList["data"][number] | null>(null);

	return (
		<>
			<ManageClientSheet
				withoutTrigger
				open={!!editingClient}
				setOpen={() => {
					setEditingClient(null);
				}}
				client={editingClient ?? undefined}
			/>

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

			<DataTable
				{...result}
				columns={createClientsTableColumns((client) => {
					setConfirmClientDelete(client);
				})}
				sortableColumns={CLIENTS_SORTABLE_COLUMNS}
				onTableRowClick={(client) => {
					if (client.id) {
						setEditingClient(client);
					}
				}}
			/>
		</>
	);
}

export { ClientsTable };
