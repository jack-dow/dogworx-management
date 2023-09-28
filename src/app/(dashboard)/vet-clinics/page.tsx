import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { VetClinicsTable } from "./_components/vet-clinics-table";

export const metadata: Metadata = {
	title: "Vet Clinics | Dogworx Management",
};

async function VetsPage({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParams);

	const response = await server.app.vetClinics.all.query(validatedSearchParams);

	return (
		<>
			<PageHeader title="Manage Vets Clinics" back={{ href: "/" }} />

			<VetClinicsTable initialData={response} />
		</>
	);
}

export default VetsPage;
