import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { VetClinicsTable } from "./_components/vet-clinics-table";

export const metadata: Metadata = {
	title: "Vet Clinics | Dogworx Management",
};

async function VetsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const response = await actions.app.vetClinics.list({
		page: Number(searchParams?.page) ?? undefined,
		limit: Number(searchParams?.limit) ?? undefined,
		sortBy: typeof searchParams?.sortBy === "string" ? searchParams?.sortBy : undefined,
		sortDirection: typeof searchParams?.sortDirection === "string" ? searchParams?.sortDirection : undefined,
	});
	return (
		<>
			<PageHeader title="Manage Vets Clinics" back={{ href: "/" }} />

			<VetClinicsTable result={response.data} />
		</>
	);
}

export default VetsPage;
