"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function RefreshOnFocus() {
	const router = useRouter();

	useEffect(() => {
		const onFocus = () => {
			router.refresh();
		};

		window.addEventListener("focus", onFocus);

		return () => {
			window.removeEventListener("focus", onFocus);
		};
	}, [router]);

	return null;
}

export { RefreshOnFocus };
