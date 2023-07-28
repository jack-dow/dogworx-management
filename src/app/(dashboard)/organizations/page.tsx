import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { ManageOrganizationSheet } from "./_components/manage-organization-sheet";
import { OrganizationsTable } from "./_components/organizations-table";

export const metadata: Metadata = {
	title: "Organizations | Dogworx Management",
};

async function OrganizationsPage() {
	const organizations = await actions.auth.organizations.list();
	const session = await actions.auth.sessions.current();

	if (session.user.emailAddress !== "jack.dowww@gmail.com") {
		redirect("/");
	}

	return (
		<>
			<PageHeader title="Organizations" action={<ManageOrganizationSheet />} />

			<OrganizationsTable organizations={organizations?.data ?? []} />
		</>
	);
}

export default OrganizationsPage;
