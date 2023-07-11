"use client";

import * as React from "react";

function useConfirmPageNavigation(
	enabled: boolean,
	message = "Are you sure you want to leave this page? Any unsaved changes will be lost.",
) {
	React.useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (enabled) {
				event.preventDefault();
				event.returnValue = message;
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [enabled, message]);
}

export { useConfirmPageNavigation };
