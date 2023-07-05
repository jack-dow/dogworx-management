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
import { EditIcon, EllipsisVerticalIcon, TrashIcon, UserCircleIcon } from "~/components/ui/icons";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { generateId, InsertDogClientRelationshipSchema } from "~/api";
import { useDidUpdate } from "~/hooks/use-did-update";
import { SearchClients } from "../search-clients";
import { type ManageDogFormSchema } from "./manage-dog-form";

type Client = ManageDogFormSchema["clientRelationships"][number]["client"];

function DogClientRelationships({ control }: { control: Control<ManageDogFormSchema> }) {
	const { setValue, getValues } = useFormContext<ManageDogFormSchema>();

	const dogClientRelationships = useFieldArray({
		control,
		name: "clientRelationships",
		keyName: "rhf-id",
	});

	const [editingClient, setEditingClient] = React.useState<Client | null>(null);
	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<Client | null>(null);

	const searchClientsComboboxButtonRef = React.useRef<HTMLButtonElement>(null);

	function toggleDogClientRelationship(client: Client) {
		const dogClientRelationshipActions = { ...getValues("actions.clientRelationships") };

		const relationshipId = dogClientRelationships.fields.find(
			(clientRelationship) => clientRelationship.clientId === client.id,
		)?.relationship;

		if (relationshipId) {
			dogClientRelationships.remove(dogClientRelationships.fields.findIndex((field) => field.id === relationshipId));

			if (dogClientRelationshipActions[relationshipId]?.type === "INSERT") {
				delete dogClientRelationshipActions[relationshipId];
			} else {
				dogClientRelationshipActions[relationshipId] = {
					type: "DELETE",
					payload: relationshipId,
				};
			}
		} else {
			const id = generateId();

			dogClientRelationships.append({
				id,
				dogId: getValues("id"),
				clientId: client.id,
				relationship: "owner",
				client,
			});

			dogClientRelationshipActions[id] = {
				type: "INSERT",
				payload: {
					id,
					dogId: getValues("id"),
					clientId: client.id,
					relationship: "owner",
				},
			};
		}

		setValue("actions.clientRelationships", dogClientRelationshipActions);
	}

	useDidUpdate(() => {
		if (!editingClient) {
			searchClientsComboboxButtonRef?.current?.focus();
		}
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
					<Label htmlFor="dog-search">Search Clients</Label>
					<div className="mt-2">
						<SearchClients
							ref={searchClientsComboboxButtonRef}
							selectedClients={dogClientRelationships.fields.map((clientRelationship) => clientRelationship.client)}
							onClientSelect={(client) => {
								toggleDogClientRelationship(client);
							}}
						/>
					</div>
				</div>
				<div className="sm:col-span-6">
					<ul role="list" className="divide-y divide-slate-100">
						{dogClientRelationships.fields.map((clientRelationship, index) => (
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
										name={`clientRelationships.${index}.relationship`}
										rules={{ required: "Please select a relationship" }}
										defaultValue={clientRelationship.relationship}
										render={({ field }) => (
											<FormItem>
												<Select
													onValueChange={(value) => {
														field.onChange(value as typeof field.value);
														setValue(`actions.clientRelationships.${clientRelationship.id}`, {
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
															{Object.values(InsertDogClientRelationshipSchema.shape.relationship.Values).map(
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
													onSelect={() => {
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

export { DogClientRelationships };
