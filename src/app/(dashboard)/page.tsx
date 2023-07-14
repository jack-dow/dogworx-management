import { type Metadata } from "next";

import { PageHeader } from "~/components/page-header";

export const metadata: Metadata = {
	title: "Dashboard | Dogworx Management",
};

function RootPage() {
	return (
		<>
			<PageHeader title="Dashboard" />
			<div className="flex flex-col space-y-4 ">
				<div className="flex shrink-0 items-center pb-3 pt-6"></div>
			</div>
		</>
	);
}

export default RootPage;
