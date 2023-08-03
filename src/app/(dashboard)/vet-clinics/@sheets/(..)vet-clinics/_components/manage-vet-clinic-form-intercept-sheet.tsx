"use client";

import { useRouter } from "next/navigation";

import { ManageVetClinicSheet } from "~/components/manage-vet-clinic-sheet";
import { type VetClinicById } from "~/actions";

function ManageVetClinicFormInterceptSheet({ vetClinic }: { vetClinic?: VetClinicById }) {
	const router = useRouter();

	return (
		<ManageVetClinicSheet
			open={true}
			setOpen={() => {
				router.back();
			}}
			withoutTrigger
			vetClinic={vetClinic}
		/>
	);
}

export { ManageVetClinicFormInterceptSheet };
