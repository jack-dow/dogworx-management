"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { type OrganizationById } from "~/actions";
import { ManageOrganization } from "../../../../organization/_components/manage-organization";

function ManageOrganizationFormInterceptSheet({ organization }: { organization?: OrganizationById | undefined }) {
	const router = useRouter();
	const [isBackClicked, setIsBackClicked] = React.useState(false);

	return (
		<ManageOrganization
			variant="sheet"
			open={true}
			setOpen={() => {
				// This prevents the user from spam clicking close (outside of sheet or x button) and causing them to go back multiple times
				if (!isBackClicked) {
					setIsBackClicked(true);
					router.back();
					router.refresh();
				}
			}}
			withoutTrigger
			organization={organization}
		/>
	);
}

export { ManageOrganizationFormInterceptSheet };
