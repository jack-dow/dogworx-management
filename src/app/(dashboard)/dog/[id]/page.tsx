import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { ManageDogForm } from "../_components/manage-dog-form";

export const metadata: Metadata = {
	title: "Update Dog | Dogworx Management",
};

async function UpdateDogPage({ params }: { params: { id: string } }) {
	const dog = await actions.app.dogs.byId(params.id);

	return (
		<>
			<PageHeader
				title={`Update Dog${dog.data?.givenName ? ` "${dog.data.givenName}" ` : ""}`}
				back={{ href: "/dogs" }}
			/>

			{dog.data ? <ManageDogForm dog={dog.data} /> : <div>Dog not found D:</div>}
		</>
	);
}
export default UpdateDogPage;
