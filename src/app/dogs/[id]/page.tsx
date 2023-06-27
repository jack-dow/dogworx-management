import { Layout, LayoutContent, LayoutHeader, LayoutNavigation, LayoutTitle } from "~/components/ui/layout";
import { api } from "~/api";
import { ManageDogForm } from "~/app/dogs/_components/manage-dog-form";

async function Page({ params }: { params: { id: string } }) {
	const dog = await api.dogs.byId(params.id);

	return (
		<Layout>
			<LayoutHeader>
				<LayoutNavigation />
				<LayoutTitle>Update Dog{dog.data?.givenName && ` "${dog.data.givenName}"`}</LayoutTitle>
			</LayoutHeader>
			<LayoutContent>{dog.data ? <ManageDogForm dog={dog.data} /> : <div>Dog not found D:</div>}</LayoutContent>
		</Layout>
	);
}
export default Page;
