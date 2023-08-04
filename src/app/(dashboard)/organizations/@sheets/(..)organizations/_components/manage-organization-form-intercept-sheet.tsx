"use client";

import { useRouter } from "next/navigation";

import { type OrganizationById } from "~/actions";
import { ManageOrganization } from "../../../_components/manage-organization";

function ManageOrganizationFormInterceptSheet({ organization }: { organization?: OrganizationById | undefined }) {
	const router = useRouter();

	return (
		<ManageOrganization
			variant="sheet"
			open={true}
			setOpen={() => {
				router.back();
			}}
			withoutTrigger
			organization={organization}
		/>
	);
}

export { ManageOrganizationFormInterceptSheet };