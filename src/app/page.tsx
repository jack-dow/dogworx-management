import { redirect } from "next/navigation";

import { env } from "~/env.mjs";

function RootPage() {
	if (env.NODE_ENV !== "development") {
		redirect("/dashboard");
	}

	return <></>;
}

export default RootPage;
