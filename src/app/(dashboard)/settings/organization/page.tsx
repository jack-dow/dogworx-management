import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { ManageOrganizationForm } from "~/components/manage-organization-form/manage-organization-form";
import { NotFound } from "~/components/not-found";
import { PageHeader } from "~/components/page-header";
import { server } from "~/lib/trpc/server";

export const metadata: Metadata = {
	title: "Organization Settings | Dogworx Management",
};

async function OrganizationSettingsPage() {
	const { data: session } = await server.auth.user.sessions.current.query();

	if (!session) {
		redirect("/sign-in");
	}

	const result = await server.auth.organizations.byId.query({ id: session.user.organizationId });

	return (
		<>
			<PageHeader title="Organization Settings" back={{ href: "/" }} />

			{result.data ? <ManageOrganizationForm organization={result.data} /> : <NotFound />}
		</>
	);
}
export default OrganizationSettingsPage;
