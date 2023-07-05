import { useEffect, useRef, type DependencyList, type EffectCallback } from "react";

// When component mounts useEffect hook is called. This is fine in most cases, but if you need to track value changes you will need to implement something like this to prevent useEffect call on mount:
function useDidUpdate(fn: EffectCallback, dependencies?: DependencyList) {
	const mounted = useRef(false);

	useEffect(
		() => () => {
			mounted.current = false;
		},
		[],
	);

	useEffect(() => {
		if (mounted.current) {
			return fn();
		}

		mounted.current = true;
		return undefined;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, dependencies);
}

export { useDidUpdate };
