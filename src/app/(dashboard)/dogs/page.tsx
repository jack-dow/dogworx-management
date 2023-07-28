import { type Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { actions } from "~/actions";
import { DogsTable } from "./_components/dogs-table";

export const metadata: Metadata = {
	title: "Dogs | Dogworx Management",
};

async function DogsPage() {
	const { data: dogs } = await actions.app.dogs.list();

	return (
		<>
			<PageHeader
				title="Manage Dogs"
				action={
					<Link href="/dogs/new">
						<Button>Create Dog</Button>
					</Link>
				}
			/>

			<DogsTable dogs={dogs ?? []} />
		</>
	);
}

export default DogsPage;
