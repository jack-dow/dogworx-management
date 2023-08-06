"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ManageVetClinic } from "~/components/manage-vet-clinic";
import { type VetClinicById } from "~/actions";

function ManageVetClinicFormInterceptSheet({ vetClinic }: { vetClinic?: VetClinicById | undefined }) {
	const router = useRouter();
	const [isBackClicked, setIsBackClicked] = React.useState(false);

	return (
		<ManageVetClinic
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
			vetClinic={vetClinic}
		/>
	);
}

export { ManageVetClinicFormInterceptSheet };
