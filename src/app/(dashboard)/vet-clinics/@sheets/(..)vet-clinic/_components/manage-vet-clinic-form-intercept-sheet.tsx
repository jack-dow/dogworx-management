"use client";

import { useRouter } from "next/navigation";

import { ManageVetClinic } from "~/components/manage-vet-clinic";
import { type VetClinicById } from "~/actions";

function ManageVetClinicFormInterceptSheet({ vetClinic }: { vetClinic?: VetClinicById | undefined }) {
	const router = useRouter();

	return (
		<ManageVetClinic
			variant="sheet"
			open={true}
			setOpen={() => {
				router.back();
				router.refresh();
			}}
			withoutTrigger
			vetClinic={vetClinic}
		/>
	);
}

export { ManageVetClinicFormInterceptSheet };
