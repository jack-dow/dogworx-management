"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";

import { CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useDidUpdate } from "~/hooks/use-did-update";
import { cn, shareRef } from "~/lib/client-utils";
import { CheckIcon } from "./icons";
import { Loader } from "./loader";
import { useToast } from "./use-toast";

type RequiredResultProps = { id: string };

type MultiSelectSearchComboboxProps<Result extends RequiredResultProps> = {
	resultLabel: (result: Result) => string;
	onSearch: (searchTerm: string) => Promise<Array<Result>>;
	renderActions?: ({ searchTerm }: { searchTerm: string }) => React.ReactNode;
	selected?: Array<Result>;
	onSelectedChange?: (selected: Array<Result>) => void;
	onSelect?: (result: Result) => void | Promise<void>;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	classNames?: {
		input?: string;
		results?: string;
	};
};

// HACK: Using custom type to allow generics with forwardRef. Using this method to void recasting React.forwardRef like this: https://fettblog.eu/typescript-react-generic-forward-refs/#option-3%3A-augment-forwardref
// As that gets rid of properties like displayName which make it a whole mess. This is a hacky solution but it works. See: https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref/58473012
// Hopefully forwardRef types will be fixed in the future
interface WithForwardRefType extends React.FC<MultiSelectSearchComboboxProps<RequiredResultProps>> {
	<T extends RequiredResultProps>(
		props: MultiSelectSearchComboboxProps<T> & { ref?: React.ForwardedRef<HTMLInputElement> },
	): ReturnType<React.FC<MultiSelectSearchComboboxProps<T>>>;
}

const MultiSelectSearchCombobox: WithForwardRefType = React.forwardRef(
	(
		{
			resultLabel,
			onSearch,
			placeholder,
			selected = [],
			onSelectedChange,
			onSelect,
			disabled,
			renderActions,
			className,
			classNames,
		},
		ref: React.ForwardedRef<HTMLInputElement>,
	) => {
		const { toast } = useToast();
		const inputRef = React.useRef<HTMLInputElement>(null);

		const [isOpen, setIsOpen] = React.useState(false);
		const [searchTerm, setSearchTerm] = React.useState("");
		const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 200);
		const [results, setResults] = React.useState<Array<RequiredResultProps>>(selected);
		const [_selected, _setSelected] = React.useState(selected);
		const [isLoading, setIsLoading] = React.useState(false);
		const [, startTransition] = React.useTransition();

		const internalSelected = selected ?? _selected;
		const setSelected = onSelectedChange ?? _setSelected;

		const handleKeyDown = React.useCallback(
			(event: React.KeyboardEvent<HTMLDivElement>) => {
				const input = inputRef.current;
				if (!input) {
					return;
				}

				if (event.key === "Escape") {
					if (isOpen) {
						event.stopPropagation();
						setIsOpen(false);
					}
				} else {
					if (!isOpen) {
						setIsOpen(true);
					}
				}
			},
			[isOpen, setIsOpen],
		);

		React.useEffect(() => {
			if (searchTerm === "") {
				setResults(selected);
			}
			_setSelected(selected);
		}, [selected, searchTerm]);

		useDidUpdate(() => {
			if (!debouncedSearchTerm) {
				return;
			}

			startTransition(() => {
				onSearch(debouncedSearchTerm)
					.then((data) => {
						if (searchTerm) {
							setResults(data);
						}
					})
					.catch(() => {
						toast({
							title: "Failed to search",
							description: "Something went wrong while searching. Please try again.",
							variant: "destructive",
						});
					})
					.finally(() => {
						setIsLoading(false);
					});
			});
		}, [debouncedSearchTerm]);

		const handleSelectOption = React.useCallback(
			(selectedOption: RequiredResultProps) => {
				let newSelected: Array<RequiredResultProps> = [];

				if (internalSelected.some((option) => selectedOption.id === option.id)) {
					newSelected = internalSelected.filter((option) => selectedOption.id !== option.id);
				} else {
					newSelected = [...internalSelected, selectedOption];
				}

				setSelected(newSelected);
				void onSelect?.(selectedOption);
			},
			[setSelected, internalSelected, onSelect],
		);

		return (
			<CommandPrimitive onKeyDown={handleKeyDown} shouldFilter={false} loop>
				<div>
					<CommandInput
						ref={shareRef(inputRef, ref)}
						value={searchTerm}
						onValueChange={(value) => {
							setSearchTerm(value);
							if (value !== "") {
								setIsLoading(true);
								return;
							}

							setIsLoading(false);
							setResults(selected);
						}}
						onBlur={() => {
							// HACK: This hack is ugly but ensures that this is run after all other react events before the next render.
							// This is required otherwise when the combobox is within another radix component, like sheet or dialog, it has some funky focus behavior
							setTimeout(() => {
								setIsOpen(false);
							}, 0);
						}}
						onFocus={() => setIsOpen(true)}
						placeholder={placeholder}
						disabled={disabled}
						className={cn(classNames?.input, className)}
					/>
				</div>

				<div className="relative mt-1">
					{isOpen && (isLoading || results.length > 0 || renderActions || searchTerm !== "") && (
						<div
							className={cn(
								"absolute top-0 z-10 w-80 rounded-md bg-white shadow-lg outline-none animate-in fade-in-0 zoom-in-95 mt-1",
								classNames?.results,
							)}
						>
							<CommandList className="rounded-md ring-1 ring-slate-200">
								{isLoading && (
									<CommandPrimitive.Loading>
										<div className="flex items-center justify-center py-6">
											<Loader className="m-0" variant="black" size="sm" />
										</div>
									</CommandPrimitive.Loading>
								)}

								{results.length > 0 && !isLoading && (
									<CommandGroup className="max-h-[150px] overflow-auto">
										{results.map((option) => {
											const isSelected = internalSelected.some((selectedOption) => selectedOption.id === option.id);
											return (
												<Option
													key={option.id}
													option={option}
													isSelected={isSelected}
													onSelect={() => handleSelectOption(option)}
													resultLabel={resultLabel}
												/>
											);
										})}
									</CommandGroup>
								)}

								{!isLoading && searchTerm !== "" && results.length === 0 && (
									<div
										className={cn(
											"select-none rounded-sm px-2 pt-6 text-center text-sm",
											!renderActions ? "pb-6" : "pb-3.5",
										)}
									>
										No results found...
									</div>
								)}

								{!isLoading && (searchTerm === "" || results.length === 0) && renderActions && (
									// IMPORTANT: We need to substring the search term here because otherwise if the searchTerm is too long it causes the app to freeze
									<CommandGroup heading="Actions">
										{renderActions({ searchTerm: searchTerm.substring(0, 30) })}
									</CommandGroup>
								)}
							</CommandList>
						</div>
					)}
				</div>
			</CommandPrimitive>
		);
	},
);
MultiSelectSearchCombobox.displayName = "MultiSelectSearch";

function Option({
	option,
	isSelected,
	onSelect,
	resultLabel,
}: {
	option: RequiredResultProps;
	isSelected: boolean;
	onSelect: () => void | Promise<void>;
	resultLabel: (result: RequiredResultProps) => string;
}) {
	const [isLoading, setIsLoading] = React.useState(false);
	return (
		<CommandItem
			key={option.id}
			value={option.id}
			onMouseDown={(event) => {
				event.preventDefault();
				event.stopPropagation();
			}}
			onSelect={() => {
				setIsLoading(true);

				Promise.resolve(onSelect())
					.catch(() => {})
					.finally(() => {
						setIsLoading(false);
					});
			}}
			className={cn("flex items-center gap-2 w-full", !isSelected ? "pl-8" : null)}
		>
			{isLoading ? (
				<Loader size="sm" variant="black" className="ml-2 mr-0" />
			) : isSelected ? (
				<CheckIcon className="w-4" />
			) : null}
			{resultLabel(option)}
		</CommandItem>
	);
}

const MultiSelectSearchComboboxAction = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>((props, ref) => (
	<CommandItem
		ref={ref}
		{...props}
		onMouseDown={(event) => {
			event.preventDefault();
			event.stopPropagation();
			if (props.onMouseDown) {
				props.onMouseDown(event);
			}
		}}
	/>
));

MultiSelectSearchComboboxAction.displayName = CommandPrimitive.Item.displayName;

export { MultiSelectSearchCombobox, MultiSelectSearchComboboxAction };
