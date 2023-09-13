import { type Metadata } from "next";

import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { ManageDogForm } from "../_components/manage-dog-form/manage-dog-form";

export function generateMetadata({ params }: { params: { id: string } }) {
	return {
		title: `${params.id === "new" ? "Create" : "Update"} Dog | Dogworx Management`,
	} satisfies Metadata;
}

async function UpdateDogPage({ params }: { params: { id: string } }) {
	const [dog, bookingTypes] = await Promise.all([
		params.id === "new" ? undefined : await actions.app.dogs.byId(params.id),
		await actions.app.bookingTypes.list(),
	]);

	return (
		<>
			<PageHeader
				title={`${params.id === "new" ? "Create" : "Update"} Dog${
					dog?.data?.givenName ? ` "${dog?.data.givenName}" ` : ""
				}`}
				back={{ href: "/dogs" }}
			/>

			{dog?.data !== null ? <ManageDogForm dog={dog?.data} bookingTypes={bookingTypes.data.data} /> : <NotFound />}
		</>
	);
}
export default UpdateDogPage;
