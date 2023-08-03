import { type Metadata } from "next";

import { actions } from "~/actions";
import { ManageClientFormInterceptSheet } from "../_components/manage-client-form-intercept-sheet";

export const metadata: Metadata = {
	title: "Update Client | Dogworx Management",
};

async function UpdateClientPageInterceptSheet({ params }: { params: { id: string } }) {
	const response = await actions.app.clients.byId(params.id);

	return <ManageClientFormInterceptSheet client={response.data} />;
}

export default UpdateClientPageInterceptSheet;
