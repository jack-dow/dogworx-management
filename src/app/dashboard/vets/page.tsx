import { type Metadata } from "next";

import { ManageVetSheet } from "~/components/manage-vet-sheet";
import { PageHeader } from "~/components/page-header";
import { api } from "~/api";
import { VetsTable } from "./_components/vets-table";

export const metadata: Metadata = {
	title: "Vets | Dogworx Management",
};

async function VetsPage() {
	const { data: vets } = await api.vets.list();
	return (
		<>
			<PageHeader title="Manage Vets" action={<ManageVetSheet />} />

			<VetsTable vets={vets ?? []} />
		</>
	);
}

export default VetsPage;
