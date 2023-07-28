"use client";

import * as React from "react";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { actions, type OrganizationsList } from "~/actions";
import { ManageOrganizationSheet } from "./manage-organization-sheet";
import { createOrganizationsTableColumns } from "./organizations-table-columns";

function OrganizationsTable({ organizations }: { organizations: OrganizationsList }) {
	const { toast } = useToast();

	const [editingOrganization, setEditingOrganization] = React.useState<OrganizationsList[number] | null>();
	const [confirmOrganizationDelete, setConfirmOrganizationDelete] = React.useState<OrganizationsList[number] | null>(
		null,
	);

	return (
		<>
			<ManageOrganizationSheet
				withoutTrigger
				open={!!editingOrganization}
				setOpen={() => {
					setEditingOrganization(null);
				}}
				organization={editingOrganization ?? undefined}
			/>

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
							description: `Successfully deleted organization "${confirmOrganizationDelete.name}}"`,
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
				data={organizations}
				columns={createOrganizationsTableColumns((organization) => {
					setConfirmOrganizationDelete(organization);
				})}
				onTableRowClick={(organization) => {
					if (organization.id) {
						setEditingOrganization(organization);
					}
				}}
				filterInputPlaceholder="Filter organizations..."
			/>
		</>
	);
}

export { OrganizationsTable };
