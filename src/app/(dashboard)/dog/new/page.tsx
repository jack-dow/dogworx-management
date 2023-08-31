import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { ManageDogForm } from "../_components/manage-dog-form";

export const metadata: Metadata = {
	title: "Create New Dog | Dogworx Management",
};

async function NewDogPage() {
	const bookingTypes = await actions.app.bookingTypes.list();

	return (
		<>
			<PageHeader title="Create New Dog" back={{ href: "/dogs" }} />

			<ManageDogForm bookingTypes={bookingTypes.data.data} />
		</>
	);
}

export default NewDogPage;
