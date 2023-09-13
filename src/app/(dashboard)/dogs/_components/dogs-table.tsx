"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/lib/trpc/client";
import { type RouterOutputs } from "~/server";
import { DOGS_SORTABLE_COLUMNS } from "~/server/router/sortable-columns";
import { logInDevelopment } from "~/utils";
import { createDogsTableColumns } from "./dogs-table-columns";

function DogsTable({ initialResult }: { initialResult: RouterOutputs["app"]["dogs"]["all"] }) {
	const { toast } = useToast();
	const searchParams = useSearchParams();

	const context = api.useContext();

	const result = api.app.dogs.all.useQuery(
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

	const deleteMutation = api.app.dogs.delete.useMutation();
	const [confirmDogDelete, setConfirmDogDelete] = React.useState<
		RouterOutputs["app"]["dogs"]["all"]["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				name="dog"
				withoutTrigger
				open={!!confirmDogDelete}
				onOpenChange={() => {
					setConfirmDogDelete(null);
				}}
				onConfirm={async () => {
					if (confirmDogDelete == null) return;

					try {
						await deleteMutation.mutateAsync({ id: confirmDogDelete.id });

						toast({
							title: `Dog deleted`,
							description: `Successfully deleted dog "${confirmDogDelete.givenName}".`,
						});
					} catch (error) {
						logInDevelopment(error);

						toast({
							title: `Dog deletion failed`,
							description: `There was an error deleting dog "${confirmDogDelete.givenName}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await context.app.dogs.search.fetch({ searchTerm });

						return result.data;
					},
					resultLabel: (dog) => `${dog.givenName} ${dog.familyName}`,
				}}
				columns={createDogsTableColumns((dog) => {
					setConfirmDogDelete(dog);
				})}
				sortableColumns={DOGS_SORTABLE_COLUMNS}
				{...result.data}
			/>
		</>
	);
}

export { DogsTable };
