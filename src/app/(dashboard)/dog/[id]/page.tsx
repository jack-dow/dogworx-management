import { type Metadata } from "next";

import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { ManageDogForm } from "../_components/manage-dog-form";

export const metadata: Metadata = {
	title: "Update Dog | Dogworx Management",
};

async function UpdateDogPage({ params }: { params: { id: string } }) {
	const [dog, bookingTypes] = await Promise.all([
		await actions.app.dogs.byId(params.id),
		await actions.app.bookingTypes.list(),
	]);

	return (
		<>
			<PageHeader
				title={`Update Dog${dog.data?.givenName ? ` "${dog.data.givenName}" ` : ""}`}
				back={{ href: "/dogs" }}
			/>

			{dog.data ? <ManageDogForm dog={dog.data} bookingTypes={bookingTypes.data.data} /> : <NotFound />}
		</>
	);
}
export default UpdateDogPage;
