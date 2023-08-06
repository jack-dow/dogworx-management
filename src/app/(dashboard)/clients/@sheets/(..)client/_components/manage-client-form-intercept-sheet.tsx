"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ManageClient } from "~/components/manage-client";
import { type ClientById } from "~/actions";

function ManageClientFormInterceptSheet({ client }: { client?: ClientById | undefined }) {
	const router = useRouter();
	const [isBackClicked, setIsBackClicked] = React.useState(false);

	return (
		<ManageClient
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
			client={client}
		/>
	);
}

export { ManageClientFormInterceptSheet };
