"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/lib/trpc/client";
import { logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";
import { VETS_SORTABLE_COLUMNS } from "~/server/router/sortable-columns";
import { createVetsTableColumns } from "./vets-table-columns";

function VetsTable({ initialData }: { initialData: RouterOutputs["app"]["vets"]["all"] }) {
	const { toast } = useToast();

	const searchParams = useSearchParams();

	const context = api.useContext();

	const result = api.app.vets.all.useQuery(
		{
			page: searchParams.get("page") ?? undefined,
			limit: searchParams.get("limit") ?? undefined,
			sortBy: searchParams.get("sortBy") ?? undefined,
			sortDirection: searchParams.get("sortDirection") ?? undefined,
		},
		{
			initialData: initialData,
		},
	);

	const deleteMutation = api.app.vets.delete.useMutation();
	const [confirmVetDelete, setConfirmVetDelete] = React.useState<
		RouterOutputs["app"]["vets"]["all"]["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				name="vet"
				withoutTrigger
				open={!!confirmVetDelete}
				onOpenChange={() => {
					setConfirmVetDelete(null);
				}}
				onConfirm={async () => {
					if (confirmVetDelete == null) return;

					try {
						await deleteMutation.mutateAsync({ id: confirmVetDelete.id });

						toast({
							title: `Vet deleted`,
							description: `Successfully deleted vet "${confirmVetDelete.givenName}${
								confirmVetDelete.familyName ? " " + confirmVetDelete.familyName : ""
							}".`,
						});
					} catch (error) {
						logInDevelopment(error);

						toast({
							title: `Vet deletion failed`,
							description: `There was an error deleting vet "${confirmVetDelete.givenName}${
								confirmVetDelete.familyName ? " " + confirmVetDelete.familyName : ""
							}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await context.app.vets.search.fetch({ searchTerm });

						return result.data;
					},
					resultLabel: (vet) => `${vet.givenName} ${vet.familyName}`,
				}}
				columns={createVetsTableColumns((vet) => {
					setConfirmVetDelete(vet);
				})}
				sortableColumns={VETS_SORTABLE_COLUMNS}
				{...result.data}
			/>
		</>
	);
}

export { VetsTable };
