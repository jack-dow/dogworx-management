import Link from "next/link";

import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { api } from "~/api";
import { DogsTable } from "./_components/dogs-table";

async function DogsPage() {
	const { data: dogs } = await api.dogs.list();

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
