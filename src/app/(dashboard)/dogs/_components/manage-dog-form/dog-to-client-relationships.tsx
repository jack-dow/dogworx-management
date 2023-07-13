"use client";

import * as React from "react";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

import { ManageClientSheet } from "~/components/manage-client-sheet";
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
import { api, generateId, InsertDogToClientRelationshipSchema, type DogById } from "~/api";
import { type ManageDogFormSchema } from "./manage-dog-form";

type Client = ManageDogFormSchema["dogToClientRelationships"][number]["client"];

function DogToClientRelationships({
	control,
	existingDogToClientRelationships,
}: {
	control: Control<ManageDogFormSchema>;
	existingDogToClientRelationships: DogById["dogToClientRelationships"] | undefined;
}) {
	const { setValue, getValues } = useFormContext<ManageDogFormSchema>();

	const dogToClientRelationships = useFieldArray({
		control,
		name: "dogToClientRelationships",
		keyName: "rhf-id",
	});

	const [editingClient, setEditingClient] = React.useState<Client | null>(null);
	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);
	const [isCreateClientSheetOpen, setIsCreateClientSheetOpen] = React.useState(false);

	const searchClientsComboboxTriggerRef = React.useRef<HTMLButtonElement>(null);

	function handleDogToClientRelationshipDelete(relationshipId: string) {
		const dogToClientRelationshipActions = { ...getValues("actions.dogToClientRelationships") };

		dogToClientRelationships.remove(dogToClientRelationships.fields.findIndex((field) => field.id === relationshipId));

		if (dogToClientRelationshipActions[relationshipId]?.type === "INSERT") {
			delete dogToClientRelationshipActions[relationshipId];
		} else {
			dogToClientRelationshipActions[relationshipId] = {
				type: "DELETE",
				payload: relationshipId,
			};
		}

		setValue("actions.dogToClientRelationships", dogToClientRelationshipActions);

		// HACK: Focus the combobox trigger after the dialog closes
		setTimeout(() => {
			searchClientsComboboxTriggerRef?.current?.focus();
		}, 0);
	}

	function toggleDogToClientRelationship(client: Client) {
		const relationshipId = dogToClientRelationships.fields.find(
			(clientRelationship) => clientRelationship.clientId === client.id,
		)?.id;

		if (relationshipId) {
			const existingDogToClientRelationship = existingDogToClientRelationships?.find(
				(dogToClientRelationship) => dogToClientRelationship.id === relationshipId,
			);
			if (existingDogToClientRelationship) {
				setConfirmRelationshipDelete(existingDogToClientRelationship.id);
			} else {
				handleDogToClientRelationshipDelete(relationshipId);
			}

			return;
		}

		const id = generateId();

		dogToClientRelationships.append({
			id,
			dogId: getValues("id"),
			clientId: client.id,
			relationship: "owner",
			client,
		});

		setValue("actions.dogToClientRelationships", {
			...getValues("actions.dogToClientRelationships"),
			[id]: {
				type: "INSERT",
				payload: {
					id,
					dogId: getValues("id"),
					clientId: client.id,
					relationship: "owner",
				},
			},
		});
	}

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
						handleDogToClientRelationshipDelete(confirmRelationshipDelete);
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
						ref={searchClientsComboboxTriggerRef}
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
							toggleDogToClientRelationship(client);
						}}
						renderResultItemText={(client) => `${client.givenName} ${client.familyName}`}
						renderNoResultActions={({ searchTerm, setConfirmedNoResults, inputRef, results, setResults }) => (
							<>
								<ManageClientSheet
									open={isCreateClientSheetOpen}
									setOpen={(value) => {
										setIsCreateClientSheetOpen(value);

										if (value === false) {
											// HACK: Focus the input after the sheet closes
											setTimeout(() => {
												inputRef?.current?.focus();
											}, 0);
										}
									}}
									defaultValues={{
										givenName:
											searchTerm.split(" ").length === 1 ? searchTerm : searchTerm.split(" ").slice(0, -1).join(" "),
										familyName: searchTerm.split(" ").length > 1 ? searchTerm.split(" ").pop() : undefined,
									}}
									onSuccessfulSubmit={(client) => {
										toggleDogToClientRelationship(client);
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
														toggleDogToClientRelationship(clientRelationship.client);
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
