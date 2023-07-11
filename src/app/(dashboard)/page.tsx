import { ManageVetSheet } from "~/components/manage-vet-sheet";
import { PageHeader } from "~/components/page-header";

function RootPage() {
	return (
		<>
			<PageHeader title="Dashboard" />
			<div className="flex flex-col space-y-4 ">
				<div className="flex shrink-0 items-center pb-3 pt-6">
					<ManageVetSheet />
				</div>
			</div>
		</>
	);
}

export default RootPage;
