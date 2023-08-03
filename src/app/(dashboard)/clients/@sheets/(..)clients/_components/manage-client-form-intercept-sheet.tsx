"use client";

import { useRouter } from "next/navigation";

import { ManageClient } from "~/components/manage-client";
import { type ClientById } from "~/actions";

function ManageClientFormInterceptSheet({ client }: { client?: ClientById }) {
	const router = useRouter();

	return (
		<ManageClient
			type="sheet"
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
