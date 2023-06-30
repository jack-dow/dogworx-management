import { PageHeader } from "~/components/page-header";

function RootPage() {
	return (
		<>
			<PageHeader title="Dashboard" />
			<div className="flex flex-col space-y-4">{/* <ToastDemo /> */}</div>
		</>
	);
}

export default RootPage;
