"use client";

import { useRouter } from "next/navigation";

import { ManageVet } from "~/components/manage-vet";
import { type VetById } from "~/actions";

function ManageVetFormInterceptSheet({ vet }: { vet?: VetById | undefined }) {
	const router = useRouter();

	return (
		<ManageVet
			variant="sheet"
			open={true}
			setOpen={() => {
				router.back();
				router.refresh();
			}}
			withoutTrigger
			vet={vet}
		/>
	);
}

export { ManageVetFormInterceptSheet };
