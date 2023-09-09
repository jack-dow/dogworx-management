import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "~/components/page-header";
import { actions } from "~/actions";
import { OrganizationsTable } from "./_components/organizations-table";

export const metadata: Metadata = {
	title: "Organizations | Dogworx Management",
};

async function OrganizationsPage({
	searchParams,
}: {
	searchParams?: { [key: string]: string | string[] | undefined };
}) {
	const response = await actions.auth.organizations.list({
		page: Number(searchParams?.page) ?? undefined,
		limit: Number(searchParams?.limit) ?? undefined,
		sortBy: typeof searchParams?.sortBy === "string" ? searchParams?.sortBy : undefined,
		sortDirection: typeof searchParams?.sortDirection === "string" ? searchParams?.sortDirection : undefined,
	});
	const session = await actions.auth.sessions.current();

	if (session.user.organizationId !== "1") {
		redirect("/");
	}

	return (
		<>
			<PageHeader title="Organizations" back={{ href: "/" }} />

			<OrganizationsTable result={response.data} />
		</>
	);
}

export default OrganizationsPage;
