"use client";

import { useRouter } from "next/navigation";

import { type OrganizationById } from "~/actions";
import { ManageOrganization } from "../../../../organization/_components/manage-organization";

function ManageOrganizationFormInterceptSheet({ organization }: { organization?: OrganizationById | undefined }) {
	const router = useRouter();

	return (
		<ManageOrganization
			variant="sheet"
			open={true}
			setOpen={() => {
				router.back();
				router.refresh();
			}}
			withoutTrigger
			organization={organization}
		/>
	);
}

export { ManageOrganizationFormInterceptSheet };
