import { PageHeader } from "~/components/page-header";
import { ToastDemo } from "~/components/toast-demo";

function RootPage() {
	return (
		<>
			<PageHeader title="Dashboard" />
			<div className="space-x-4">
				<ToastDemo />
			</div>
		</>
	);
}

export default RootPage;
