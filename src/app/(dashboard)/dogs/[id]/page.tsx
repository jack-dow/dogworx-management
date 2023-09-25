import { type Metadata } from "next";

import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";
import { ManageDogForm } from "../_components/manage-dog-form/manage-dog-form";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { id: string } }) {
	return {
		title: `${params.id === "new" ? "Create" : "Update"} Dog | Dogworx Management`,
	} satisfies Metadata;
}

async function UpdateDogPage({ params }: { params: { id: string } }) {
	const [dog, bookingTypes] = await Promise.all([
		params.id === "new" ? undefined : await server.app.dogs.byId.query({ id: params.id }),
		await server.app.bookingTypes.all.query({}),
	]);

	return (
		<>
			<PageHeader title={`${params.id === "new" ? "Create" : "Update"} Dog`} back={{ href: "/dogs" }} />

			{dog?.data !== null ? <ManageDogForm initialData={dog} bookingTypes={bookingTypes.data} /> : <NotFound />}
		</>
	);
}
export default UpdateDogPage;
