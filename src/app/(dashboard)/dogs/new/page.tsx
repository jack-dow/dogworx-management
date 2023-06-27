import { PageHeader } from "~/components/page-header";
import { ManageDogForm } from "../_components/manage-dog-form";

function NewDogPage() {
	return (
		<>
			<PageHeader title="Create New Dog" />

			<ManageDogForm />
		</>
	);
}

export default NewDogPage;
