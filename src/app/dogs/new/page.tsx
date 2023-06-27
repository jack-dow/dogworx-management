import { Layout, LayoutContent, LayoutHeader, LayoutNavigation, LayoutTitle } from "~/components/ui/layout";
import { ManageDogForm } from "~/app/dogs/_components/manage-dog-form";

export default function NewDogPage() {
	return (
		<Layout>
			<LayoutHeader>
				<LayoutNavigation />
				<LayoutTitle>Create New Dog</LayoutTitle>
			</LayoutHeader>
			<LayoutContent>
				<ManageDogForm />
			</LayoutContent>
		</Layout>
	);
}
