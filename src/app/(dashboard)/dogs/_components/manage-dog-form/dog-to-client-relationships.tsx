"use client";

import * as React from "react";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

import { ManageClientSheet } from "~/components/manage-client-sheet/manage-client-sheet";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { EditIcon, EllipsisVerticalIcon, TrashIcon, UserCircleIcon, UserPlusIcon } from "~/components/ui/icons";
import { SearchCombobox, SearchNoResultActionItem } from "~/components/ui/search-combobox";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { api, generateId, InsertDogToClientRelationshipSchema } from "~/api";
import { useDidUpdate } from "~/hooks/use-did-update";
import { type ManageDogFormSchema } from "./manage-dog-form";

type Client = ManageDogFormSchema["dogToClientRelationships"][number]["client"];

function DogToClientRelationships({ control }: { control: Control<ManageDogFormSchema> }) {
	const { setValue, getValues } = useFormContext<ManageDogFormSchema>();

	const dogToClientRelationships = useFieldArray({
		control,
		name: "dogToClientRelationships",
		keyName: "rhf-id",
	});

	const [editingClient, setEditingClient] = React.useState<Client | null>(null);
	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<Client | null>(null);
	const [isCreateClientSheetOpen, setIsCreateClientSheetOpen] = React.useState(false);

	const searchClientsComboboxButtonRef = React.useRef<HTMLButtonElement>(null);

	function toggleDogClientRelationship(client: Client) {
		const dogToClientRelationshipActions = { ...getValues("actions.dogToClientRelationships") };

		const relationshipId = dogToClientRelationships.fields.find(
			(clientRelationship) => clientRelationship.clientId === client.id,
		)?.relationship;

		if (relationshipId) {
			dogToClientRelationships.remove(
				dogToClientRelationships.fields.findIndex((field) => field.id === relationshipId),
			);

			if (dogToClientRelationshipActions[relationshipId]?.type === "INSERT") {
				delete dogToClientRelationshipActions[relationshipId];
			} else {
				dogToClientRelationshipActions[relationshipId] = {
					type: "DELETE",
					payload: relationshipId,
				};
			}
		} else {
			const id = generateId();

			dogToClientRelationships.append({
				id,
				dogId: getValues("id"),
				clientId: client.id,
				relationship: "owner",
				client,
			});

			dogToClientRelationshipActions[id] = {
				type: "INSERT",
				payload: {
					id,
					dogId: getValues("id"),
					clientId: client.id,
					relationship: "owner",
				},
			};
		}

		setValue("actions.dogToClientRelationships", dogToClientRelationshipActions);
	}

	useDidUpdate(() => {
		// if (!editingClient) {
		// 	searchClientsComboboxButtonRef?.current?.focus();
		// }
	}, [editingClient]);

	return (
		<>
			<ManageClientSheet
				client={editingClient ?? undefined}
				open={!!editingClient}
				setOpen={() => setEditingClient(null)}
				withoutTrigger
			/>

			<DestructiveActionDialog
				title="Are you sure?"
				description="Once you save this dog, this relationship will be permanently deleted."
				open={!!confirmRelationshipDelete}
				onOpenChange={() => setConfirmRelationshipDelete(null)}
				actionText="Delete relationship"
				onConfirm={() => {
					if (confirmRelationshipDelete) {
						toggleDogClientRelationship(confirmRelationshipDelete);
						// HACK: Focus the button after the dialog closes
						setTimeout(() => {
							searchClientsComboboxButtonRef?.current?.focus();
						}, 0);
					}
				}}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
				<div className="col-span-full">
					<h3 className="text-base font-semibold leading-7 text-slate-900">Clients</h3>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">
						Manage the relationships between this dog and clients.
					</p>
				</div>
				<div className="sm:col-span-6">
					<SearchCombobox
						ref={searchClientsComboboxButtonRef}
						labelText="Search Clients"
						triggerText={
							dogToClientRelationships.fields.length === 0
								? "Search Clients"
								: dogToClientRelationships.fields.length === 1
								? "1 client selected"
								: `${dogToClientRelationships.fields.length} clients selected`
						}
						onSearch={async (searchTerm) => {
							try {
								const res = await api.clients.search(searchTerm);

								return res.data ?? [];
							} catch (error) {
								console.log("Error fetching data:", error);
								return [];
							}
						}}
						selected={dogToClientRelationships.fields.map((clientRelationship) => clientRelationship.client)}
						onSelect={(client) => {
							toggleDogClientRelationship(client);
						}}
						renderResultItemText={(client) => `${client.givenName} ${client.familyName}`}
						renderNoResultActions={({ searchTerm, setConfirmedNoResults, inputRef, results, setResults }) => (
							<>
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
										toggleDogClientRelationship(client);
										setResults([...results, client]);
										setConfirmedNoResults(false);
										inputRef?.current?.focus();
									}}
									withoutTrigger
								/>

								<SearchNoResultActionItem
									onSelect={() => {
										setIsCreateClientSheetOpen(true);
									}}
								>
									<UserPlusIcon className="mr-2 h-4 w-4" />
									<span>Create new client &quot;{searchTerm}&quot;</span>
								</SearchNoResultActionItem>
							</>
						)}
					/>
				</div>
				<div className="sm:col-span-6">
					<ul role="list" className="divide-y divide-slate-100">
						{dogToClientRelationships.fields.map((clientRelationship, index) => (
							<li key={clientRelationship.id} className="flex max-w-full items-center justify-between gap-x-6 py-4">
								<div className="flex items-center gap-x-4">
									<div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
										<UserCircleIcon className="h-5 w-5" />
									</div>

									<div className="min-w-0 flex-auto truncate">
										<p className="text-sm font-semibold leading-6 text-slate-900">
											{clientRelationship.client.givenName} {clientRelationship.client.familyName}
										</p>
										<p className="truncate text-xs leading-5 text-slate-500">
											{clientRelationship.client.emailAddress}
										</p>
									</div>
								</div>

								<div className="flex space-x-4">
									<FormField
										control={control}
										name={`dogToClientRelationships.${index}.relationship`}
										rules={{ required: "Please select a relationship" }}
										defaultValue={clientRelationship.relationship}
										render={({ field }) => (
											<FormItem>
												<Select
													onValueChange={(value) => {
														field.onChange(value as typeof field.value);
														setValue(`actions.dogToClientRelationships.${clientRelationship.id}`, {
															type: "UPDATE",
															payload: {
																...clientRelationship,
																relationship: value as typeof field.value,
															},
														});
													}}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select a relation">
																<span className="truncate capitalize">{field.value?.split("-").join(" ")}</span>
															</SelectValue>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectGroup>
															<SelectLabel>Relationships</SelectLabel>
															{Object.values(InsertDogToClientRelationshipSchema.shape.relationship.Values).map(
																(relation) => (
																	<SelectItem key={relation} value={relation} className="capitalize">
																		{relation.split("-").join(" ")}
																	</SelectItem>
																),
															)}
														</SelectGroup>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="flex items-center">
										<DropdownMenu>
											<DropdownMenuTrigger className="flex items-center rounded-full text-slate-400 hover:text-slate-600  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
												<span className="sr-only">Open options</span>
												<EllipsisVerticalIcon className="h-5 w-5" />
											</DropdownMenuTrigger>
											<DropdownMenuContent>
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault();
														setEditingClient(clientRelationship.client);
													}}
												>
													<EditIcon className="mr-2 h-4 w-4" />
													<span>Edit Client</span>
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={() => {
														setConfirmRelationshipDelete(clientRelationship.client);
													}}
												>
													<TrashIcon className="mr-2 h-4 w-4" />
													<span>Remove</span>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>
		</>
	);
}

export { DogToClientRelationships };
