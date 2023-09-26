"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { logInDevelopment } from "~/lib/client-utils";
import { api } from "~/lib/trpc/client";
import { type RouterOutputs } from "~/server";
import { CLIENTS_SORTABLE_COLUMNS } from "~/server/router/sortable-columns";
import { createClientsTableColumns } from "./clients-table-columns";

function ClientsTable({ initialData }: { initialData: RouterOutputs["app"]["clients"]["all"] }) {
	const { toast } = useToast();

	const searchParams = useSearchParams();

	const context = api.useContext();

	const result = api.app.clients.all.useQuery(
		{
			page: searchParams.get("page") ?? undefined,
			limit: searchParams.get("limit") ?? undefined,
			sortBy: searchParams.get("sortBy") ?? undefined,
			sortDirection: searchParams.get("sortDirection") ?? undefined,
		},
		{ initialData },
	);

	const deleteMutation = api.app.clients.delete.useMutation();
	const [confirmClientDelete, setConfirmClientDelete] = React.useState<
		RouterOutputs["app"]["clients"]["all"]["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				name="client"
				withoutTrigger
				open={!!confirmClientDelete}
				onOpenChange={() => {
					setConfirmClientDelete(null);
				}}
				onConfirm={async () => {
					if (confirmClientDelete == null) return;

					try {
						await deleteMutation.mutateAsync({ id: confirmClientDelete.id });
						toast({
							title: `Client deleted`,
							description: `Successfully deleted client "${confirmClientDelete.givenName}${
								confirmClientDelete.familyName ? " " + confirmClientDelete.familyName : ""
							}".`,
						});
					} catch (error) {
						logInDevelopment(error);

						toast({
							title: `Client deletion failed`,
							description: `There was an error deleting client "${confirmClientDelete.givenName}${
								confirmClientDelete.familyName ? " " + confirmClientDelete.familyName : ""
							}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await context.app.clients.search.fetch({ searchTerm });

						return result.data;
					},
					resultLabel: (client) => `${client.givenName} ${client.familyName}`,
				}}
				columns={createClientsTableColumns((client) => {
					setConfirmClientDelete(client);
				})}
				sortableColumns={CLIENTS_SORTABLE_COLUMNS}
				{...result.data}
			/>
		</>
	);
}

export { ClientsTable };
