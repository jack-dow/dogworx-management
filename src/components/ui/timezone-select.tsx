import * as React from "react";
import useVirtual from "react-cool-virtual";
import { useTimezoneSelect, type ITimezone, type ITimezoneOption } from "react-timezone-select";

import { Command, CommandGroup, CommandInput, CommandItem } from "~/components/ui/command";
import { api } from "~/lib/trpc/client";
import { cn } from "~/lib/utils";
import { CheckIcon } from "./icons";

interface ICity {
	city: string;
	timezone: string;
	pop: number;
}

function cityFilter(city: ICity | ITimezoneOption, filter: string) {
	if ("pop" in city) {
		return city.city.toLowerCase().includes(filter.toLowerCase());
	}

	return city.value.toLowerCase().includes(filter.toLowerCase());
}

export function TimezoneSelect({
	value,
	onChange,
}: {
	value: string | null;
	onChange: (value: ITimezoneOption | null) => void;
}) {
	const { data } = api.app.timezones.city.useQuery(undefined, {
		trpc: { context: { skipBatch: true } },
	});

	const { options, parseTimezone } = useTimezoneSelect({
		labelStyle: "original",
	});

	const inputRef = React.useRef<HTMLInputElement>(null);
	const [open, setOpen] = React.useState(false);
	const [selected, setSelected] = React.useState<ITimezoneOption | null>(value ? parseTimezone(value) : null);
	const [inputValue, setInputValue] = React.useState(value ?? "");

	const cities = !inputValue
		? options
		: [...options, ...(data ?? [])].filter((option) => cityFilter(option, inputValue));

	const { outerRef, innerRef, items } = useVirtual({
		itemCount: cities.length, // Provide the total number for the list items
		itemSize: 32, // The size of each item (default = 50)
	});

	return (
		<Command
			onKeyDown={(e) => {
				const input = inputRef.current;
				if (input) {
					// This is not a default behaviour of the <input /> field
					if (e.key === "Escape") {
						input.blur();
					}
				}
			}}
			shouldFilter={false}
			className="overflow-visible bg-transparent"
		>
			<CommandInput
				ref={inputRef}
				value={inputValue}
				onValueChange={setInputValue}
				onBlur={() => setOpen(false)}
				onFocus={() => setOpen(true)}
				placeholder="Select timezone..."
			/>

			<div className="relative mt-2">
				<div
					className={cn(
						"absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in",
						// Hide to using css, otherwise it causes useVirtual to not work properly
						open && cities.length > 0 ? "" : "hidden",
					)}
				>
					<CommandGroup
						className="max-h-[150px] w-full overflow-auto"
						// style={{ height: (32 * cities.length < 150 ? 32 * cities.length : 150) + 8 }}
						ref={outerRef as React.Ref<HTMLDivElement>}
					>
						<div ref={innerRef as React.Ref<HTMLDivElement>}>
							{items.map(({ index, size }) => {
								return (
									<Option
										key={index}
										index={index}
										onSelect={(option) => {
											setInputValue(option.value);
											onChange(option);
											setSelected(option);
											setOpen(false);
										}}
										style={{ height: size }}
										cities={cities}
										selected={selected}
										parseTimezone={parseTimezone}
									/>
								);
							})}
						</div>
					</CommandGroup>
				</div>
			</div>
		</Command>
	);
}

function Option({
	onSelect,
	selected,
	index,
	cities,
	parseTimezone,
	style,
}: {
	onSelect: (option: ITimezoneOption) => void;
	selected: ITimezoneOption | null;
	index: number;
	cities: (ITimezoneOption | ICity)[];
	parseTimezone: (timezone: string) => ITimezoneOption | null;
	style: React.CSSProperties;
}) {
	const city = cities[index];

	if (!city) {
		return;
	}
	const option = "pop" in city ? parseTimezone(city.timezone) : city;

	if (!option) {
		return;
	}

	const id = "pop" in city ? city.city : option.value;

	const isSelected = selected?.value === option.value;

	return (
		<CommandItem
			value={id}
			onMouseDown={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			onSelect={() => onSelect(option)}
			className={cn("flex items-center gap-2 w-full", !isSelected ? "pl-8" : null)}
			style={style}
		>
			{isSelected ? <CheckIcon className="w-4" /> : null}
			{id} {option.label.split(" ")[0]}
		</CommandItem>
	);
}

export type { ITimezone, ITimezoneOption };
