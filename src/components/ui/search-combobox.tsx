"use client";

import * as React from "react";

import { Button } from "~/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { CheckIcon, ChevronUpDownIcon } from "~/components/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useDidUpdate } from "~/hooks/use-did-update";
import { cn } from "~/utils";
import { Label } from "./label";
import { Loader } from "./loader";

type SearchComboboxContextProps = {
	searchTerm: string;
	confirmedNoResults: boolean;
	setConfirmedNoResults: (value: boolean) => void;
	inputRef: React.RefObject<HTMLInputElement>;
	results: Array<RequiredResultProps>;
	setResults: (value: Array<RequiredResultProps>) => void;
};

const SearchComboboxContent = React.createContext<SearchComboboxContextProps | null>(null);

type RequiredResultProps = {
	id: string;
};

interface SearchComboboxProps<Result> {
	labelText: string;
	triggerText: string;
	onSearch: (searchTerm: string) => Promise<Array<Result>>;
	selected: Array<Result>;
	onSelect: (result: Result) => void;
	renderResultItemText: (result: Result) => string;
	renderNoResultActions?: (props: SearchComboboxContextProps) => React.ReactNode;
	/** Sets Popover modal prop to false and makes Popover content not render in a portal to ensure proper focus control when combobox is rendered within a sheet */
	withinSheet?: boolean;
	disabled?: boolean;
}

// HACK: Using custom type to allow generics with forwardRef. Using this method to void recasting React.forwardRef like this: https://fettblog.eu/typescript-react-generic-forward-refs/#option-3%3A-augment-forwardref
// As that gets rid of properties like displayName which make it a whole mess. This is a hacky solution but it works. See: https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref/58473012
// Hopefully forwardRef types will be fixed in the future
interface WithForwardRefType extends React.FC<SearchComboboxProps<RequiredResultProps>> {
	<T extends RequiredResultProps>(
		props: SearchComboboxProps<T> & { ref: React.ForwardedRef<HTMLButtonElement> },
	): ReturnType<React.FC<SearchComboboxProps<T>>>;
}

const SearchCombobox: WithForwardRefType = React.forwardRef(
	(
		{
			labelText,
			triggerText,
			onSearch,
			selected,
			onSelect,
			renderResultItemText,
			renderNoResultActions,
			withinSheet = false,
			disabled = false,
		},
		ref: React.ForwardedRef<HTMLButtonElement>,
	) => {
		const [isOpen, setIsOpen] = React.useState(false);
		const [searchTerm, setSearchTerm] = React.useState("");
		const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 250);
		const [confirmedNoResults, setConfirmedNoResults] = React.useState(false);
		const [results, setResults] = React.useState<Array<RequiredResultProps>>(selected);

		const inputRef = React.useRef<HTMLInputElement>(null);
		const triggerId = React.useId();

		useDidUpdate(() => {
			if (!debouncedSearchTerm) {
				return;
			}

			const fetchResults = async () => {
				const res = await onSearch(debouncedSearchTerm);

				setResults(res ?? []);

				if (!res || res.length === 0) {
					setConfirmedNoResults(true);
				}
			};

			void fetchResults();
		}, [debouncedSearchTerm]);

		React.useEffect(() => {
			if (searchTerm === "") {
				setResults(selected);
				setConfirmedNoResults(false);
			}
		}, [selected, searchTerm]);

		return (
			<SearchComboboxContent.Provider
				value={{ searchTerm, confirmedNoResults, setConfirmedNoResults, inputRef, results, setResults }}
			>
				<Label htmlFor={triggerId}>{labelText}</Label>
				<div className="mt-2">
					<Popover
						open={isOpen}
						onOpenChange={(open) => {
							setIsOpen(open);
							if (open === false) {
								setConfirmedNoResults(true);
								setSearchTerm("");
							}
						}}
						modal={!withinSheet}
					>
						<PopoverTrigger asChild ref={ref}>
							<Button
								id={triggerId}
								variant="outline"
								role="combobox"
								aria-expanded={isOpen}
								className="w-full"
								disabled={disabled}
							>
								<span className="mr-2 truncate">{triggerText}</span>
								<ChevronUpDownIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="max-w-3xl p-0 " align="start" withoutPortal={withinSheet}>
							<Command loop shouldFilter={false}>
								<CommandInput
									ref={inputRef}
									value={searchTerm}
									onValueChange={(value) => {
										setSearchTerm(value);

										if (value) {
											setResults([]);
											setConfirmedNoResults(false);
										}
									}}
								/>
								<CommandList>
									{!confirmedNoResults && (
										<CommandEmpty>
											<div className="flex items-center justify-center">
												<Loader className="m-0" variant="black" size="sm" />
											</div>
										</CommandEmpty>
									)}

									{results.length > 0 && (
										<CommandGroup className="max-h-[145px] overflow-auto">
											{results.map((result) => {
												const isActive = !!selected.find(({ id }) => id === result.id);
												return (
													<CommandItem
														key={result.id}
														value={result.id}
														onSelect={() => {
															onSelect(result);
															inputRef?.current?.focus();
														}}
													>
														<CheckIcon className={cn("mr-2 h-4 w-4", isActive ? "opacity-100" : "opacity-0")} />
														<span className="flex-1">{renderResultItemText(result)}</span>
													</CommandItem>
												);
											})}
										</CommandGroup>
									)}

									{confirmedNoResults && searchTerm !== "" && (
										<div className="py-6 pb-[18px] text-center text-sm">No results found...</div>
									)}

									{((results.length === 0 && searchTerm === "") || confirmedNoResults) && renderNoResultActions && (
										<CommandGroup heading="Actions">
											{renderNoResultActions({
												searchTerm,
												confirmedNoResults,
												setConfirmedNoResults,
												inputRef,
												results,
												setResults,
											})}
										</CommandGroup>
									)}
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
			</SearchComboboxContent.Provider>
		);
	},
);
SearchCombobox.displayName = "Search";

export { SearchCombobox, CommandItem as SearchComboboxItem };
