import { ManageClientSheet } from "~/components/manage-client-sheet/manage-client-sheet";
import { PageHeader } from "~/components/page-header";
import { api } from "~/api";
import { ClientTable } from "./_components/client-table";

async function ClientsPage() {
	const result = await api.clients.list();

	return (
		<>
			<PageHeader
				title="Manage Clients"
				action={
					<ManageClientSheet
						defaultValues={
							{
								// givenName: "John",
								// familyName: "Doe",
								// emailAddress: "john@exmaple.com",
								// phoneNumber: "0444444444",
								// streetAddress: "123 Main St",
								// state: "San Francisco",
								// city: "CA",
								// postalCode: "94114",
							}
						}
					/>
				}
			/>

			<ClientTable clients={result.data ?? []} />
		</>
	);
}

export default ClientsPage;
