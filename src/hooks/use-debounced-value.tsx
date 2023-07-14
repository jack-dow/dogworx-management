import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebouncedValue<T = any>(value: T, wait: number, options = { leading: false }) {
	const [_value, setValue] = React.useState(value);
	const mountedRef = React.useRef(false);
	const timeoutRef = React.useRef<number | null>(null);
	const cooldownRef = React.useRef(false);

	const cancel = () => window.clearTimeout(timeoutRef.current ?? undefined);

	React.useEffect(() => {
		if (mountedRef.current) {
			if (!cooldownRef.current && options.leading) {
				cooldownRef.current = true;
				setValue(value);
			} else {
				cancel();
				timeoutRef.current = window.setTimeout(() => {
					cooldownRef.current = false;
					setValue(value);
				}, wait);
			}
		}
	}, [value, options.leading, wait]);

	React.useEffect(() => {
		mountedRef.current = true;
		return cancel;
	}, []);

	return [_value, cancel] as const;
}

export { useDebouncedValue };
