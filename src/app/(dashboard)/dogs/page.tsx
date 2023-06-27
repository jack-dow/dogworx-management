import Link from "next/link";

import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { api } from "~/api";
import { DogTable } from "./_components/dog-table";

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

			<DogTable dogs={dogs ?? []} />
		</>
	);
}

export default DogsPage;
