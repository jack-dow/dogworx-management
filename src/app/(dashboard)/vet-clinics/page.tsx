import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { VetClinicsTable } from "./_components/vet-clinics-table";

export const metadata: Metadata = {
	title: "Vet Clinics | Dogworx Management",
};

async function VetsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const response = await server.app.vetClinics.all.query({
		page: Number(searchParams?.page) ?? undefined,
		limit: Number(searchParams?.limit) ?? undefined,
		sortBy: typeof searchParams?.sortBy === "string" ? searchParams?.sortBy : undefined,
		sortDirection: typeof searchParams?.sortDirection === "string" ? searchParams?.sortDirection : undefined,
	});
	return (
		<>
			<PageHeader title="Manage Vets Clinics" back={{ href: "/" }} />

			<VetClinicsTable initialResult={response} />
		</>
	);
}

export default VetsPage;
