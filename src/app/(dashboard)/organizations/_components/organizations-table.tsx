"use client";

import * as React from "react";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions, type OrganizationsList } from "~/actions";
import { ORGANIZATIONS_SORTABLE_COLUMNS } from "~/actions/sortable-columns";
import { createOrganizationsTableColumns } from "./organizations-table-columns";

function OrganizationsTable({ result }: { result: OrganizationsList }) {
	const { toast } = useToast();

	const [confirmOrganizationDelete, setConfirmOrganizationDelete] = React.useState<
		OrganizationsList["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				open={!!confirmOrganizationDelete}
				onOpenChange={() => {
					setConfirmOrganizationDelete(null);
				}}
				title="Are you sure?"
				description="This action will permanently delete this organization and any associated relationships. This action cannot be undone."
				actionText="Delete organization"
				onConfirm={async () => {
					if (confirmOrganizationDelete == null) return;

					const result = await actions.auth.organizations.delete(confirmOrganizationDelete.id);

					if (result.success) {
						toast({
							title: `Organization deleted`,
							description: `Successfully deleted organization "${confirmOrganizationDelete.name}"`,
						});
					} else {
						toast({
							title: `Organization deletion failed`,
							description: `There was an error deleting organization "${confirmOrganizationDelete.name}". Please try again.`,
						});
					}
				}}
			/>

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
				}}
				columns={createOrganizationsTableColumns((client) => {
					setConfirmOrganizationDelete(client);
				})}
				sortableColumns={ORGANIZATIONS_SORTABLE_COLUMNS}
				{...result}
			/>
		</>
	);
}

export { OrganizationsTable };
