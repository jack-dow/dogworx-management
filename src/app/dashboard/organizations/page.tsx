import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "~/components/page-header";
import { api } from "~/api";
import { getServerUser } from "~/lib/session";
import { ManageOrganizationSheet } from "./_components/manage-organization-sheet";
import { OrganizationsTable } from "./_components/organizations-table";

export const metadata: Metadata = {
	title: "Organizations | Dogworx Management",
};

async function OrganizationsPage() {
	const organizations = await api.organizations.list();
	const user = await getServerUser();

	if (user.email !== "jack.dowww@gmail.com") {
		redirect("/dashboard");
	}

	return (
		<>
			<PageHeader title="Organizations" action={<ManageOrganizationSheet />} />

			<OrganizationsTable organizations={organizations?.data ?? []} />
		</>
	);
}

export default OrganizationsPage;
