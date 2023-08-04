"use client";

import { useRouter } from "next/navigation";

import { ManageClient } from "~/components/manage-client";
import { type ClientById } from "~/actions";

function ManageClientFormInterceptSheet({ client }: { client?: ClientById | undefined }) {
	const router = useRouter();

	return (
		<ManageClient
			variant="sheet"
			open={true}
			setOpen={() => {
				router.back();
			}}
			withoutTrigger
			client={client}
		/>
	);
}

export { ManageClientFormInterceptSheet };
