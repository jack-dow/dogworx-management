import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "~/components/page-header";
import { env } from "~/env.mjs";
import { server } from "~/lib/trpc/server";
import { PaginationOptionsSchema, type SearchParams } from "~/lib/utils";
import { OrganizationsTable } from "./_components/organizations-table";

export const metadata: Metadata = {
	title: "Organizations | Dogworx Management",
};

async function OrganizationsPage({ searchParams }: { searchParams?: SearchParams }) {
	const validatedSearchParams = PaginationOptionsSchema.parse(searchParams);

	const response = await server.auth.organizations.all.query(validatedSearchParams);
	const { data: session } = await server.auth.user.sessions.current.query();

	if (!session || session.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID) {
		redirect("/");
	}

	return (
		<>
			<PageHeader title="Organizations" back={{ href: "/" }} />

			<OrganizationsTable initialData={response} />
		</>
	);
}

export default OrganizationsPage;
