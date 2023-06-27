import { ToastDemo } from "~/components/toast-demo";
import { Layout, LayoutContent, LayoutHeader, LayoutTitle } from "~/components/ui/layout";

export default function Page() {
	return (
		<Layout>
			<LayoutHeader>
				<LayoutTitle>Dashboard</LayoutTitle>
			</LayoutHeader>
			<LayoutContent>
				<div className="space-x-4">
					<ToastDemo />
				</div>
			</LayoutContent>
		</Layout>
	);
}
