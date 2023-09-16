"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/lib/trpc/client";
import { logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";
import { ORGANIZATIONS_SORTABLE_COLUMNS } from "~/server/router/sortable-columns";
import { createOrganizationsTableColumns } from "./organizations-table-columns";

function OrganizationsTable({ initialResult }: { initialResult: RouterOutputs["auth"]["organizations"]["all"] }) {
	const { toast } = useToast();

	const searchParams = useSearchParams();

	const context = api.useContext();

	const result = api.auth.organizations.all.useQuery(
		{
			page: searchParams.get("page") ?? undefined,
			limit: searchParams.get("limit") ?? undefined,
			sortBy: searchParams.get("sortBy") ?? undefined,
			sortDirection: searchParams.get("sortDirection") ?? undefined,
		},
		{
			initialData: initialResult,
		},
	);

	const deleteMutation = api.auth.organizations.delete.useMutation();
	const [confirmOrganizationDelete, setConfirmOrganizationDelete] = React.useState<
		RouterOutputs["auth"]["organizations"]["all"]["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				name="organization"
				withoutTrigger
				open={!!confirmOrganizationDelete}
				onOpenChange={() => {
					setConfirmOrganizationDelete(null);
				}}
				onConfirm={async () => {
					if (confirmOrganizationDelete == null) return;

					try {
						await deleteMutation.mutateAsync({ id: confirmOrganizationDelete.id });

						toast({
							title: `Organization deleted`,
							description: `Successfully deleted organization "${confirmOrganizationDelete.name}".`,
						});
					} catch (error) {
						logInDevelopment(error);

						toast({
							title: `Organization deletion failed`,
							description: `There was an error deleting organization "${confirmOrganizationDelete.name}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await context.auth.organizations.search.fetch({ searchTerm });

						return result.data;
					},
					resultLabel: (organization) => organization.name,
				}}
				columns={createOrganizationsTableColumns((organization) => {
					setConfirmOrganizationDelete(organization);
				})}
				sortableColumns={ORGANIZATIONS_SORTABLE_COLUMNS}
				{...result.data}
			/>
		</>
	);
}

export { OrganizationsTable };
