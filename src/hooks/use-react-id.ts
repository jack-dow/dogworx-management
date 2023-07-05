/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

const __useId: () => string | undefined = (React as any)["useId".toString()] || (() => undefined);

function useReactId() {
	const id = __useId();
	return id ? `dogworx-${id.replace(/:/g, "")}` : "";
}

export { useReactId };
