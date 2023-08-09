"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";

import { CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useDidUpdate } from "~/hooks/use-did-update";
import { cn, shareRef } from "~/utils";
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
	onSelect?: (result: Result) => void;
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
		const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 250);
		const [results, setResults] = React.useState<Array<RequiredResultProps>>([]);
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

				// Keep the options displayed when the user is typing
				if (!isOpen) {
					setIsOpen(true);
				}

				if (event.key === "Escape") {
					input.blur();
				}
			},
			[isOpen, setIsOpen],
		);

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
				onSelect?.(selectedOption);
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
						onBlur={() => setIsOpen(false)}
						onFocus={() => setIsOpen(true)}
						placeholder={placeholder}
						disabled={disabled}
						className={cn(classNames?.input, className)}
					/>
				</div>

				<div className="relative mt-1">
					{isOpen && (
						<div
							className={cn(
								"absolute top-0 z-10 w-96 rounded-md bg-white shadow-lg outline-none animate-in fade-in-0 zoom-in-95 mt-1",
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
												<CommandItem
													key={option.id}
													value={option.id}
													onMouseDown={(event) => {
														event.preventDefault();
														event.stopPropagation();
													}}
													onSelect={() => handleSelectOption(option)}
													className={cn("flex items-center gap-2 w-full", !isSelected ? "pl-8" : null)}
												>
													{isSelected ? <CheckIcon className="w-4" /> : null}
													{resultLabel(option)}
												</CommandItem>
											);
										})}
									</CommandGroup>
								)}

								{!isLoading && searchTerm !== "" && results.length === 0 && (
									<div className="select-none rounded-sm px-2 pb-3 pt-6 text-center text-sm">No results found...</div>
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

export { MultiSelectSearchCombobox, CommandItem as MultiSelectSearchComboboxAction };
