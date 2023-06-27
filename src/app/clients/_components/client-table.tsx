"use client";

import * as React from "react";

import { ManageClientSheet } from "~/components/manage-client-sheet/manage-client-sheet";
import { DataTable } from "~/components/ui/data-table";
import { type ClientWithDogRelationships } from "~/db/drizzle-schema";
import { clientTableColumns } from "./client-table-columns";

function ClientTable({ clients }: { clients: ClientWithDogRelationships[] }) {
	const [editingClient, setEditingClient] = React.useState<ClientWithDogRelationships | null>();

	return (
		<>
			{/* Mounts new sheet on each client edit to ensure default values are (re)set properly */}
			{editingClient && (
				<ManageClientSheet
					withoutTrigger
					open={true}
					setOpen={() => {
						setEditingClient(null);
					}}
					client={editingClient}
				/>
			)}
			<DataTable
				data={clients}
				columns={clientTableColumns}
				onTableRowClick={(client) => {
					if (client.id) {
						setEditingClient(client);
					}
				}}
			/>
		</>
	);
}

export { ClientTable };
