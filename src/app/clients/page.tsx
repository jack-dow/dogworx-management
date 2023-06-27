import { ManageClientSheet } from "~/components/manage-client-sheet/manage-client-sheet";
import { Layout, LayoutContent, LayoutHeader, LayoutNavigation, LayoutTitle } from "~/components/ui/layout";
import { api } from "~/api";
import { ClientTable } from "./_components/client-table";

async function ClientsPage() {
	const result = await api.clients.list();

	return (
		<Layout>
			<LayoutHeader>
				<LayoutNavigation />
				<div className="flex justify-between">
					<LayoutTitle>Manage Clients</LayoutTitle>
					<ManageClientSheet
						defaultValues={{
							givenName: "John",
							familyName: "Doe",
							emailAddress: "john@exmaple.com",
							phoneNumber: "0444444444",

							streetAddress: "123 Main St",
							state: "San Francisco",
							city: "CA",
							postalCode: "94114",
						}}
					/>
				</div>
			</LayoutHeader>
			<LayoutContent>
				<ClientTable clients={result.data ?? []} />
			</LayoutContent>
		</Layout>
	);
}

export default ClientsPage;
