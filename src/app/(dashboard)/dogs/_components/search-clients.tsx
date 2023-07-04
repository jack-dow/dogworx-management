"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

import { ManageClientSheet } from "~/components/manage-client-sheet/manage-client-sheet";
import { Button } from "~/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { CheckIcon, ChevronUpDownIcon, UserPlusIcon } from "~/components/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { api } from "~/api";
import { useDidUpdate } from "~/hooks/use-did-update";
import { cn } from "~/lib/utils";
import { type ManageDogFormSchema } from "./manage-dog-form";

type SearchClientsProps = {
	selectedClients: Array<ManageDogFormSchema["clientRelationships"][number]["client"]>;
	onClientSelect: (client: ManageDogFormSchema["clientRelationships"][number]["client"]) => void;
};

const SearchClients = forwardRef<HTMLButtonElement, SearchClientsProps>(({ selectedClients, onClientSelect }, ref) => {
	const [isComboboxOpen, setIsComboboxOpen] = useState(false);
	const [isCreateClientSheetOpen, setIsCreateClientSheetOpen] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);
	const [searchTerm, setSearchTerm] = useState("");

	const [confirmedNoResults, setConfirmedNoResults] = useState(false);

	const [results, setResults] =
		useState<Array<ManageDogFormSchema["clientRelationships"][number]["client"]>>(selectedClients);

	useDidUpdate(() => {
		setResults([]);
		setConfirmedNoResults(false);

		if (!searchTerm) {
			return;
		}

		const fetchClients = async () => {
			try {
				const res = await api.clients.search(searchTerm);

				setResults(res.data ?? []);

				if (!res.data || res.data.length === 0) {
					setConfirmedNoResults(true);
				}
			} catch (error) {
				console.error("Error fetching data:", error);
				setConfirmedNoResults(true);
			}
		};

		const getDataTimeout = setTimeout(() => void fetchClients(), 500);

		return () => {
			clearTimeout(getDataTimeout);
		};
	}, [searchTerm]);

	useEffect(() => {
		if (!searchTerm) {
			setResults(selectedClients);
			if (selectedClients.length === 0) {
				setConfirmedNoResults(true);
			}
			return;
		}
	}, [searchTerm, selectedClients]);

	return (
		<div>
			<Popover
				open={isComboboxOpen}
				onOpenChange={(open) => {
					setIsComboboxOpen(open);
					if (open === false) {
						setSearchTerm("");
					}
				}}
			>
				<PopoverTrigger asChild ref={ref}>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={isComboboxOpen}
						className="w-full justify-between text-foreground"
					>
						<span className="truncate">
							{selectedClients.length === 0 && "Search clients"}
							{selectedClients.length === 1 && "1 client selected"}
							{selectedClients.length > 1 && `${selectedClients.length} clients selected`}
						</span>
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
						<CommandInput
							ref={inputRef}
							placeholder="Search clients..."
							value={searchTerm}
							onValueChange={setSearchTerm}
						/>
						<CommandList>
							{!confirmedNoResults && <CommandEmpty>Loading...</CommandEmpty>}

							{results.length > 0 && (
								<CommandGroup className="max-h-[145px] overflow-auto">
									{results.map((client) => {
										const isActive = !!selectedClients.find(({ id }) => id === client.id);
										return (
											<CommandItem
												key={client.id}
												value={client.id}
												onSelect={() => {
													onClientSelect(client);
													inputRef?.current?.focus();
												}}
											>
												<CheckIcon className={cn("mr-2 h-4 w-4", isActive ? "opacity-100" : "opacity-0")} />
												<span className="flex-1">
													{client.givenName} {client.familyName}
												</span>
											</CommandItem>
										);
									})}
								</CommandGroup>
							)}

							{confirmedNoResults && searchTerm !== "" && (
								<>
									<div className="py-6 pb-[18px] text-center text-sm">No results found...</div>

									<ManageClientSheet
										open={isCreateClientSheetOpen}
										setOpen={(value) => {
											setIsCreateClientSheetOpen(value);

											// HACK: Focus the input after the sheet closes
											setTimeout(() => {
												inputRef?.current?.focus();
											}, 0);
										}}
										defaultValues={{
											givenName:
												searchTerm.split(" ").length === 1 ? searchTerm : searchTerm.split(" ").slice(0, -1).join(" "),
											familyName: searchTerm.split(" ").length > 1 ? searchTerm.split(" ").pop() : undefined,
											emailAddress: "john@exmaple.com",
											phoneNumber: "0444444444",

											streetAddress: "123 Main St",
											state: "San Francisco",
											city: "CA",
											postalCode: "94114",
										}}
										onSuccessfulSubmit={(client) => {
											onClientSelect(client);
											setResults([client]);
											setConfirmedNoResults(false);
											inputRef?.current?.focus();
										}}
										withoutTrigger
									/>
									<CommandGroup heading="Actions">
										<CommandItemCreate
											searchTerm={searchTerm}
											confirmedNoResults={confirmedNoResults}
											onSelect={() => {
												setIsCreateClientSheetOpen(true);
											}}
										/>
									</CommandGroup>
								</>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
});
SearchClients.displayName = "SearchClients";

type CommandItemCreateProps = {
	searchTerm: string;
	confirmedNoResults: boolean;
	onSelect: (value: string) => void;
};

const CommandItemCreate = ({ searchTerm, confirmedNoResults, onSelect }: CommandItemCreateProps) => {
	const render = searchTerm !== "" && confirmedNoResults;

	if (!render) return null;

	return (
		<CommandItem key={`${searchTerm}`} value={`${searchTerm}`} onSelect={onSelect}>
			<UserPlusIcon className="mr-2 h-4 w-4" />
			<span>Create new client &quot;{searchTerm}&quot;</span>
		</CommandItem>
	);
};

export { SearchClients };
