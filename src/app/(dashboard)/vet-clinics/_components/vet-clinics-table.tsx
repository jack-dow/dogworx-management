"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { DataTable } from "~/components/ui/data-table";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/lib/trpc/client";
import { logInDevelopment, PaginationOptionsSchema, searchParamsToObject } from "~/lib/utils";
import { type RouterOutputs } from "~/server";
import { VET_CLINICS_SORTABLE_COLUMNS } from "~/server/router/sortable-columns";
import { createVetClinicsTableColumns } from "./vet-clinics-table-columns";

function VetClinicsTable({ initialData }: { initialData: RouterOutputs["app"]["vetClinics"]["all"] }) {
	const { toast } = useToast();

	const searchParams = useSearchParams();
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParamsToObject(searchParams));

	const context = api.useContext();

	const result = api.app.vetClinics.all.useQuery(validatedSearchParams, {
		initialData: initialData,
	});

	const deleteMutation = api.app.vetClinics.delete.useMutation();

	const [confirmVetClinicDelete, setConfirmVetClinicDelete] = React.useState<
		RouterOutputs["app"]["vetClinics"]["all"]["data"][number] | null
	>(null);

	return (
		<>
			<DestructiveActionDialog
				name="vet clinic"
				withoutTrigger
				open={!!confirmVetClinicDelete}
				onOpenChange={() => {
					setConfirmVetClinicDelete(null);
				}}
				onConfirm={async () => {
					if (confirmVetClinicDelete == null) return;

					try {
						await deleteMutation.mutateAsync({ id: confirmVetClinicDelete.id });

						toast({
							title: `Vet clinic deleted`,
							description: `Successfully deleted vet clinic "${confirmVetClinicDelete.name}".`,
						});
					} catch (error) {
						logInDevelopment(error);

						toast({
							title: `Vet clinic deletion failed`,
							description: `There was an error deleting vet clinic "${confirmVetClinicDelete.name}". Please try again.`,
							variant: "destructive",
						});
					}
				}}
			/>

			<DataTable
				search={{
					onSearch: async (searchTerm) => {
						const result = await context.app.vetClinics.search.fetch({ searchTerm });

						return result.data;
					},
					resultLabel: (vetClinic) => vetClinic.name,
				}}
				columns={createVetClinicsTableColumns((vetClinic) => {
					setConfirmVetClinicDelete(vetClinic);
				})}
				sortableColumns={VET_CLINICS_SORTABLE_COLUMNS}
				{...result.data}
			/>
		</>
	);
}

export { VetClinicsTable };
