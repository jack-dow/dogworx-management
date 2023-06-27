import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Layout, LayoutContent, LayoutHeader, LayoutNavigation, LayoutTitle } from "~/components/ui/layout";
import { api } from "~/api";
import { DogTable } from "./_components/dog-table";

async function DogsPage() {
	const { data: dogs } = await api.dogs.list();

	return (
		<Layout>
			<LayoutHeader>
				<LayoutNavigation />
				<div className="flex justify-between">
					<LayoutTitle>Manage Dogs</LayoutTitle>

					<Link href="/dogs/new">
						<Button>Create Dog</Button>
					</Link>
				</div>
			</LayoutHeader>
			<LayoutContent>
				<DogTable dogs={dogs ?? []} />
			</LayoutContent>
		</Layout>
	);
}

export default DogsPage;
