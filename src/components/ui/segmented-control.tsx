import * as React from "react";

import { useReactId } from "~/hooks/use-react-id";
import { cn } from "~/lib/utils";

function randomId() {
	return `dogworx-${Math.random().toString(36).slice(2, 11)}`;
}

// useLayoutEffect will show warning if used during ssr, e.g. with Next.js
// useIsomorphicEffect removes it by replacing useLayoutEffect with useEffect during ssr
const useIsomorphicEffect = typeof document !== "undefined" ? React.useLayoutEffect : React.useEffect;

function useId(staticId?: string) {
	const reactId = useReactId();
	const [uuid, setUuid] = React.useState(reactId);

	useIsomorphicEffect(() => {
		setUuid(randomId());
	}, []);

	if (typeof staticId === "string") {
		return staticId;
	}

	if (typeof window === "undefined") {
		return reactId;
	}

	return uuid;
}

interface SegmentedControlItem {
	value: string;
	label: React.ReactNode;
	disabled?: boolean;
}

interface SegmentedControlProps extends Omit<React.ComponentPropsWithoutRef<"div">, "value" | "onChange"> {
	/** Segments to render */
	data: string[] | SegmentedControlItem[];

	/** Current selected value */
	value: string;

	/** Disabled input state */
	disabled?: boolean;

	/** Called when value changes */
	onChange: (value: string) => void;

	/** Name of the radio group, default to random id */
	name?: string;
}

const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
	({ data: _data, value, disabled, onChange, name }, ref) => {
		const mounted = React.useRef<boolean>();

		const uuid = useId(name);
		const refs = React.useRef<Record<string, HTMLLabelElement>>({});

		const data = _data.map(
			(item: string | SegmentedControlItem): SegmentedControlItem =>
				typeof item === "string" ? { label: item, value: item } : item,
		);

		useIsomorphicEffect(() => {
			if (!mounted.current) {
				mounted.current = true;
			}
		});

		const controls = data.map((item, index) => (
			<div
				key={item.value}
				className={cn(
					"relative flex-1 z-10 transition-colors duration-200 group",
					index !== data.length - 1 && "border-r border-input",
					value === item.value && "border-l-transparent border-t-transparent rounded-md shadow-xs bg-white",
				)}
			>
				<input
					className="absolute h-0 w-0 overflow-hidden whitespace-nowrap opacity-0"
					disabled={disabled || item.disabled}
					type="radio"
					name={uuid}
					value={item.value}
					id={`${uuid}-${item.value}`}
					checked={value === item.value}
					onChange={() => onChange(item.value)}
				/>

				<label
					className="block cursor-pointer overflow-hidden truncate whitespace-nowrap rounded-md p-3 py-1 text-center text-sm font-medium transition-colors duration-200 group-hover:text-primary"
					data-active={(value === item.value && !(disabled || item.disabled)) || undefined}
					data-disabled={disabled || item.disabled || undefined}
					htmlFor={`${uuid}-${item.value}`}
					ref={(node) => {
						if (node) {
							refs.current[item.value] = node;
						}
					}}
				>
					{item.label}
				</label>
			</div>
		));

		if (data.length === 0) {
			return null;
		}

		return (
			<div ref={ref} className="relative flex overflow-hidden rounded-md bg-primary-foreground p-1">
				{controls}
			</div>
		);
	},
);

SegmentedControl.displayName = "SegmentedControl";

export { SegmentedControl };
