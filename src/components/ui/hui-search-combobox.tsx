"use client";

import * as React from "react";

import { CheckIcon, UserPlusIcon } from "~/components/ui/icons";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { cn } from "~/utils";
import { Combobox, ComboboxInput, ComboboxItem, ComboboxPopover } from "./combobox";
import { Loader } from "./loader";
import { useToast } from "./use-toast";

type SearchComboboxProps<Result extends { id: string }> = {
	name: string;
	selected: Result[];
	onSearch: (searchTerm: string) => Promise<Result[]>;
	renderSearchResultItemText: (item: Result) => string;
	onResultSelect: (result: Result) => void;
	onNoResultsActionSelect: (searchTerm: string) => void;
};

type RequiredResultProps = {
	id: string;
};

// HACK: Using custom type to allow generics with forwardRef. Using this method to void recasting React.forwardRef like this: https://fettblog.eu/typescript-react-generic-forward-refs/#option-3%3A-augment-forwardref
// As that gets rid of properties like displayName which make it a whole mess. This is a hacky solution but it works. See: https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref/58473012
// Hopefully forwardRef types will be fixed in the future
interface WithForwardRefType extends React.FC<SearchComboboxProps<RequiredResultProps>> {
	<T extends RequiredResultProps>(
		props: SearchComboboxProps<T> & { ref: React.ForwardedRef<HTMLInputElement> },
	): ReturnType<React.FC<SearchComboboxProps<T>>>;
}

const SearchCombobox: WithForwardRefType = React.forwardRef(
	(
		{ name, selected, onSearch, renderSearchResultItemText, onResultSelect, onNoResultsActionSelect },
		ref: React.ForwardedRef<HTMLInputElement>,
	) => {
		const { toast } = useToast();

		const [searchTerm, setSearchTerm] = React.useState("");
		const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 250);

		const [isFetchingResults, setIsFetchingResults] = React.useState(false);

		const [results, setResults] = React.useState<RequiredResultProps[]>([]);
		const [confirmedNoResults, setConfirmedNoResults] = React.useState(false);

		React.useEffect(() => {
			if (!debouncedSearchTerm) {
				return;
			}

			onSearch(debouncedSearchTerm)
				.then((data) => {
					setResults(data);

					if (!data || data.length === 0) {
						setConfirmedNoResults(true);
					}
				})
				.catch(() => {
					toast({
						title: `Failed to search ${name}s`,
						description: `An unknown error occurred whilst trying to search. Please try again later.`,
						variant: "destructive",
					});
				})
				.finally(() => {
					setIsFetchingResults(false);
				});
		}, [debouncedSearchTerm, onSearch, name, toast]);

		return (
			<Combobox
				nullable
				onChange={(result: RequiredResultProps | null) => {
					if (result) {
						if (result.id === "new") {
							onNoResultsActionSelect(searchTerm);
							return;
						}

						onResultSelect(result);
					}
				}}
			>
				<div className="relative w-full max-w-[288px]">
					<ComboboxInput
						ref={ref}
						placeholder={`Search ${name}s...`}
						defaultValue={searchTerm}
						onChange={(event) => {
							const value = event.currentTarget.value;
							setSearchTerm(value);

							if (value) {
								setIsFetchingResults(true);
							}

							setResults(value ? [] : selected);
							setConfirmedNoResults(false);
						}}
					/>
					<ComboboxPopover
						className={cn(!isFetchingResults && !confirmedNoResults && results.length === 0 && "hidden")}
					>
						{isFetchingResults && (
							<div className="flex items-center justify-center py-6">
								<Loader className="m-0" variant="black" size="sm" />
							</div>
						)}

						{!isFetchingResults && !confirmedNoResults && results.length > 0 && (
							<>
								{results.map((result) => {
									const isActive = !!selected.find(({ id }) => id === result.id);
									return (
										<ComboboxItem key={result.id} value={result} className="justify-between">
											<CheckIcon className={cn("mr-2 h-4 w-4", isActive ? "opacity-100" : "opacity-0")} />
											<span className="flex-1">{renderSearchResultItemText(result)}</span>
										</ComboboxItem>
									);
								})}
							</>
						)}

						{!isFetchingResults && confirmedNoResults && (
							<ComboboxItem value="not-found" disabled className="py-6 pb-[18px] text-center text-sm">
								No results found...
							</ComboboxItem>
						)}

						{((results.length === 0 && searchTerm === "") || confirmedNoResults) && (
							<div className="overflow-hidden p-1 text-foreground">
								<div className=" px-2 py-1.5 text-xs font-medium text-muted-foreground">Actions</div>
								<ComboboxItem value={{ id: "new" }}>
									<UserPlusIcon className="mr-2 h-4 w-4" />
									<span>
										Create new {name} {searchTerm && `"${searchTerm}"`}
									</span>
								</ComboboxItem>
							</div>
						)}
					</ComboboxPopover>
				</div>
			</Combobox>
		);
	},
);
SearchCombobox.displayName = "SearchCombobox";
