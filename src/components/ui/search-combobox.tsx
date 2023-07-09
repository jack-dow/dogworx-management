"use client";

import * as React from "react";

import { Button } from "~/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { CheckIcon, ChevronUpDownIcon } from "~/components/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useDidUpdate } from "~/hooks/use-did-update";
import { cn } from "~/lib/utils";
import { Label } from "./label";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebouncedState<T = any>(defaultValue: T, wait: number, options = { leading: false }) {
	const [value, setValue] = React.useState(defaultValue);
	const timeoutRef = React.useRef<number | null>(null);
	const leadingRef = React.useRef(true);

	const clearTimeout = () => window.clearTimeout(timeoutRef.current ?? undefined);
	React.useEffect(() => clearTimeout, []);

	const debouncedSetValue = (newValue: T) => {
		clearTimeout();
		if (leadingRef.current && options.leading) {
			setValue(newValue);
		} else {
			timeoutRef.current = window.setTimeout(() => {
				leadingRef.current = true;
				setValue(newValue);
			}, wait);
		}
		leadingRef.current = false;
	};

	return [value, debouncedSetValue] as const;
}

type SearchComboboxContextProps = {
	searchTerm: string;
	confirmedNoResults: boolean;
	setConfirmedNoResults: (value: boolean) => void;
	inputRef: React.RefObject<HTMLInputElement>;
	results: Array<RequiredResultProps>;
	setResults: (value: Array<RequiredResultProps>) => void;
};

const SearchComboboxContent = React.createContext<SearchComboboxContextProps | null>(null);

function useSearchComboboxContent() {
	const context = React.useContext(SearchComboboxContent);

	if (!context) {
		throw new Error("useSearchComboboxContent must be used within a SearchComboboxContextProvider");
	}

	return context;
}

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
		{ labelText, triggerText, onSearch, selected, onSelect, renderResultItemText, renderNoResultActions },
		ref: React.ForwardedRef<HTMLButtonElement>,
	) => {
		const [isOpen, setIsOpen] = React.useState(false);
		const [searchTerm, setSearchTerm] = useDebouncedState("", 500);
		const [confirmedNoResults, setConfirmedNoResults] = React.useState(false);
		const [results, setResults] = React.useState<Array<RequiredResultProps>>([]);

		const inputRef = React.useRef<HTMLInputElement>(null);
		const triggerId = React.useId();

		useDidUpdate(() => {
			setResults([]);
			setConfirmedNoResults(false);

			if (!searchTerm) {
				return;
			}

			const fetchResults = async () => {
				const res = await onSearch(searchTerm);

				setResults(res ?? []);

				if (!res || res.length === 0) {
					setConfirmedNoResults(true);
				}
			};

			void fetchResults();
		}, [searchTerm]);

		React.useEffect(() => {
			if (!searchTerm) {
				setResults(selected);
				if (selected.length === 0) {
					setConfirmedNoResults(true);
				}
				return;
			}
		}, [searchTerm, selected]);

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
								setSearchTerm("");
							}
						}}
					>
						<PopoverTrigger asChild ref={ref}>
							<Button
								id={triggerId}
								variant="outline"
								role="combobox"
								aria-expanded={isOpen}
								className="w-full justify-between text-foreground"
							>
								<span className="truncate">{triggerText}</span>
								<ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="max-w-3xl p-0 " align="start">
							<Command
								loop
								filter={() => {
									return 1;
								}}
							>
								<CommandInput ref={inputRef} defaultValue={searchTerm} onValueChange={setSearchTerm} />
								<CommandList>
									{!confirmedNoResults && <CommandEmpty>Loading...</CommandEmpty>}

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
										<>
											<div className="py-6 pb-[18px] text-center text-sm">No results found...</div>

											{renderNoResultActions && (
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
										</>
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

type SearchNoResultActionItemProps = {
	onSelect: (value: string) => void;
	children: React.ReactNode;
};

const SearchNoResultActionItem = ({ onSelect, children }: SearchNoResultActionItemProps) => {
	const { searchTerm, confirmedNoResults } = useSearchComboboxContent();

	const render = searchTerm !== "" && confirmedNoResults;

	if (!render) return null;

	return (
		<CommandItem key={`${searchTerm}`} value={`${searchTerm}`} onSelect={onSelect}>
			{children}
		</CommandItem>
	);
};

export { SearchCombobox, SearchNoResultActionItem };
