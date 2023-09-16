import { type Metadata } from "next";

import { ManageVetForm } from "~/components/manage-vet/manage-vet-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";

export function generateMetadata({ params }: { params: { id: string } }) {
	return {
		title: `${params.id === "new" ? "Create" : "Update"} Vet | Dogworx Management`,
	} satisfies Metadata;
}

async function UpdateVetPage({ params }: { params: { id: string } }) {
	const vet = params.id === "new" ? undefined : await server.app.vets.byId.query({ id: params.id });

	return (
		<>
			<PageHeader
				title={`${params.id === "new" ? "Create" : "Update"} Vet${
					vet?.data?.givenName ? ` "${vet?.data.givenName} ${vet?.data.familyName}"` : ""
				}`}
				back={{ href: "/vets" }}
			/>

			{vet?.data !== null ? <ManageVetForm vet={vet?.data} /> : <NotFound />}
		</>
	);
}
export default UpdateVetPage;
