"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ManageVet } from "~/components/manage-vet";
import { type VetById } from "~/actions";

function ManageVetFormInterceptSheet({ vet }: { vet?: VetById | undefined }) {
	const router = useRouter();
	const [isBackClicked, setIsBackClicked] = React.useState(false);

	return (
		<ManageVet
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
			vet={vet}
		/>
	);
}

export { ManageVetFormInterceptSheet };
