import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";
import { ManageDogForm } from "../_components/manage-dog-form";

export const metadata: Metadata = {
	title: "Create New Dog | Dogworx Management",
};

function NewDogPage() {
	return (
		<>
			<PageHeader title="Create New Dog" back={{ href: "/dogs" }} />

			<ManageDogForm />
		</>
	);
}

export default NewDogPage;
