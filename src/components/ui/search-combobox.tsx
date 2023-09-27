"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";

import { CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useDidUpdate } from "~/hooks/use-did-update";
import { cn, shareRef } from "~/lib/utils";
import { CheckIcon } from "./icons";
import { Loader } from "./loader";
import { useToast } from "./use-toast";

type RequiredResultProps = { id: string };

type SearchComboboxProps<Result extends RequiredResultProps> = {
	resultLabel: (result: Result) => string;
	onSearch: (searchTerm: string) => Promise<Array<Result>>;
	defaultSelected?: Result | null;
	onSelectChange?: (result: Result | null) => void;
	renderActions?: ({ searchTerm }: { searchTerm: string }) => React.ReactNode;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	classNames?: {
		input?: string;
		results?: string;
	};
	onBlur?: ({
		setSearchTerm,
		setSelected,
		setResults,
	}: {
		setSearchTerm: (searchTerm: string) => void;
		setSelected: (selected: RequiredResultProps | null) => void;
		setResults: (results: Array<RequiredResultProps>) => void;
	}) => void;
};

// HACK: Using custom type to allow generics with forwardRef. Using this method to void recasting React.forwardRef like this: https://fettblog.eu/typescript-react-generic-forward-refs/#option-3%3A-augment-forwardref
// As that gets rid of properties like displayName which make it a whole mess. This is a hacky solution but it works. See: https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref/58473012
// Hopefully forwardRef types will be fixed in the future
interface WithForwardRefType extends React.FC<SearchComboboxProps<RequiredResultProps>> {
	<T extends RequiredResultProps>(
		props: SearchComboboxProps<T> & { ref?: React.ForwardedRef<HTMLInputElement> },
	): ReturnType<React.FC<SearchComboboxProps<T>>>;
}

const SearchCombobox: WithForwardRefType = React.forwardRef(
	(
		{
			resultLabel,
			onSearch,
			placeholder,
			defaultSelected,
			onSelectChange,
			disabled,
			renderActions,
			className,
			classNames,
			onBlur,
		},
		ref: React.ForwardedRef<HTMLInputElement>,
	) => {
		const { toast } = useToast();
		const inputRef = React.useRef<HTMLInputElement>(null);

		const [isOpen, setIsOpen] = React.useState(false);
		const [searchTerm, setSearchTerm] = React.useState(defaultSelected ? resultLabel(defaultSelected) : "");
		const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 200);
		const [results, setResults] = React.useState<Array<RequiredResultProps>>(defaultSelected ? [defaultSelected] : []);
		const [selected, setSelected] = React.useState<RequiredResultProps | null>(defaultSelected ?? null);
		const [isLoading, setIsLoading] = React.useState(false);
		const [, startTransition] = React.useTransition();

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

		return (
			<CommandPrimitive onKeyDown={handleKeyDown} shouldFilter={false} loop>
				<div className="relative">
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
							setResults(selected ? [selected] : []);
						}}
						onBlur={() => {
							// HACK: This hack is ugly but ensures that this is run after all other react events before the next render.
							// This is required otherwise when the combobox is within another radix component, like sheet or dialog, it has some funky focus behavior
							setTimeout(() => {
								setIsOpen(false);
								setSearchTerm(selected ? resultLabel(selected) : "");

								if (onBlur) {
									onBlur({ setSearchTerm, setSelected, setResults });
								}
							}, 0);
						}}
						onFocus={() => setIsOpen(true)}
						placeholder={placeholder}
						disabled={disabled}
						className={cn("bg-white", classNames?.input, className)}
					/>
				</div>

				<div className="relative">
					{isOpen && (isLoading || results.length > 0 || renderActions || searchTerm !== "") && (
						<div
							className={cn(
								"absolute top-0 z-10 w-80 rounded-md bg-white shadow-lg outline-none animate-in fade-in-0 zoom-in-95 mt-1",
								classNames?.results,
							)}
						>
							<CommandList className="rounded-md ring-1 ring-slate-200">
								{isLoading ? (
									<CommandPrimitive.Loading>
										<div className="flex items-center justify-center py-6">
											<Loader className="m-0" variant="black" size="sm" />
										</div>
									</CommandPrimitive.Loading>
								) : null}

								{results.length > 0 && !isLoading && (
									<CommandGroup className="max-h-[150px] overflow-auto">
										{results.map((option) => {
											const isSelected = selected?.id === option.id;

											return (
												<CommandItem
													key={option.id}
													value={option.id}
													onMouseDown={(event) => {
														event.preventDefault();
														event.stopPropagation();
													}}
													onSelect={() => {
														if (isSelected) {
															setSelected(null);
															onSelectChange?.(null);
															setSearchTerm("");
															setResults([]);
															return;
														}

														setIsOpen(false);
														setSearchTerm(resultLabel(option));
														setSelected(option);
														onSelectChange?.(option);
													}}
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
SearchCombobox.displayName = "SearchCombobox";

const SearchComboboxAction = React.forwardRef<
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
SearchComboboxAction.displayName = CommandPrimitive.Item.displayName;

export { type SearchComboboxProps, SearchCombobox, SearchComboboxAction };
