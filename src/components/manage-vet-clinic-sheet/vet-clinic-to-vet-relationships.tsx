"use client";

import * as React from "react";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

import { type ExistingVetClinic, type ManageVetClinicSheetFormSchema } from "~/components/manage-vet-clinic-sheet";
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
import { api, generateId, InsertVetToVetClinicRelationshipSchema } from "~/api";
import { ManageVetSheet } from "../manage-vet-sheet";

type Vet = ManageVetClinicSheetFormSchema["vetToVetClinicRelationships"][number]["vet"];

function VetClinicToVetRelationships({
	control,
	existingVetToVetClinicRelationships,
}: {
	control: Control<ManageVetClinicSheetFormSchema>;
	existingVetToVetClinicRelationships: ExistingVetClinic["vetToVetClinicRelationships"] | undefined;
}) {
	const { setValue, getValues } = useFormContext<ManageVetClinicSheetFormSchema>();

	const vetToVetClinicRelationships = useFieldArray({
		control,
		name: "vetToVetClinicRelationships",
		keyName: "rhf-id",
	});

	const [editingVet, setEditingVet] = React.useState<Vet | null>(null);
	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);
	const [isCreateVetSheetOpen, setIsCreateVetSheetOpen] = React.useState(false);

	const searchVetsComboboxTriggerRef = React.useRef<HTMLButtonElement>(null);

	function handleVetToVetClinicRelationshipDelete(relationshipId: string) {
		const vetToVetClinicRelationshipActions = { ...getValues("actions.vetToVetClinicRelationships") };

		vetToVetClinicRelationships.remove(
			vetToVetClinicRelationships.fields.findIndex((field) => field.id === relationshipId),
		);

		if (vetToVetClinicRelationshipActions[relationshipId]?.type === "INSERT") {
			delete vetToVetClinicRelationshipActions[relationshipId];
		} else {
			vetToVetClinicRelationshipActions[relationshipId] = {
				type: "DELETE",
				payload: relationshipId,
			};
		}

		setValue("actions.vetToVetClinicRelationships", vetToVetClinicRelationshipActions);

		// HACK: Focus the button after the dialog closes
		setTimeout(() => {
			searchVetsComboboxTriggerRef?.current?.focus();
		}, 0);
	}

	function toggleVetToVetClinicRelationship(vet: Vet) {
		const vetToVetClinicRelationshipActions = { ...getValues("actions.vetToVetClinicRelationships") };

		const relationshipId = vetToVetClinicRelationships.fields.find(
			(vetClinicRelationship) => vetClinicRelationship.vetId === vet.id,
		)?.id;

		if (relationshipId) {
			const existingVetToVetClinicRelationship = existingVetToVetClinicRelationships?.find(
				(vetToVetClinicRelationship) => vetToVetClinicRelationship.id === relationshipId,
			);

			if (existingVetToVetClinicRelationship) {
				setConfirmRelationshipDelete(existingVetToVetClinicRelationship.id);
			} else {
				handleVetToVetClinicRelationshipDelete(relationshipId);
			}
		} else {
			const id = generateId();

			vetToVetClinicRelationships.append({
				id,
				vetId: vet.id,
				vetClinicId: getValues("id"),
				relationship: "full-time",
				vet,
			});

			vetToVetClinicRelationshipActions[id] = {
				type: "INSERT",
				payload: {
					id,
					vetClinicId: getValues("id"),
					vetId: vet.id,
					relationship: "full-time",
				},
			};
		}

		setValue("actions.vetToVetClinicRelationships", vetToVetClinicRelationshipActions);
	}

	return (
		<>
			<ManageVetSheet
				vet={editingVet ?? undefined}
				open={!!editingVet}
				setOpen={() => setEditingVet(null)}
				withoutTrigger
			/>

			<DestructiveActionDialog
				title="Are you sure?"
				description="Once you save this vet clinic, this relationship will be permanently deleted."
				open={!!confirmRelationshipDelete}
				onOpenChange={() => setConfirmRelationshipDelete(null)}
				actionText="Delete relationship"
				onConfirm={() => {
					if (confirmRelationshipDelete) {
						handleVetToVetClinicRelationshipDelete(confirmRelationshipDelete);
					}
				}}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
				<div className="col-span-full">
					<h3 className="text-base font-semibold leading-7 text-slate-900">Vets</h3>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">
						Manage the relationships between this vet clinic and their vets.
					</p>
				</div>
				<div className="sm:col-span-6">
					<SearchCombobox
						withinSheet
						ref={searchVetsComboboxTriggerRef}
						labelText="Search Vets"
						triggerText={
							vetToVetClinicRelationships.fields.length === 0
								? "Search vets"
								: vetToVetClinicRelationships.fields.length === 1
								? "1 vet selected"
								: `${vetToVetClinicRelationships.fields.length} vets selected`
						}
						onSearch={async (searchTerm) => {
							try {
								const res = await api.vets.search(searchTerm);

								return res.data ?? [];
							} catch (error) {
								console.log("Error fetching data:", error);
								return [];
							}
						}}
						selected={vetToVetClinicRelationships.fields.map((vetClinicRelationship) => vetClinicRelationship.vet)}
						onSelect={(vet) => {
							toggleVetToVetClinicRelationship(vet);
						}}
						renderResultItemText={(vet) => `${vet.givenName} ${vet.familyName}`}
						renderNoResultActions={({ searchTerm, setConfirmedNoResults, inputRef, results, setResults }) => (
							<>
								<ManageVetSheet
									open={isCreateVetSheetOpen}
									setOpen={(value) => {
										setIsCreateVetSheetOpen(value);

										if (value === false) {
											// HACK: Focus the input after the sheet closes
											setTimeout(() => {
												inputRef?.current?.focus();
											}, 0);
										}
									}}
									defaultValues={{
										name: searchTerm,
										emailAddress: "john@exmaple.com",
										phoneNumber: "0444444444",
									}}
									onSuccessfulSubmit={(vet) => {
										toggleVetToVetClinicRelationship(vet);
										setResults([...results, vet]);
										setConfirmedNoResults(false);
										inputRef?.current?.focus();
									}}
									withoutTrigger
								/>

								<SearchNoResultActionItem
									onSelect={() => {
										setIsCreateVetSheetOpen(true);
									}}
								>
									<UserPlusIcon className="mr-2 h-4 w-4" />
									<span>Create new vet &quot;{searchTerm}&quot;</span>
								</SearchNoResultActionItem>
							</>
						)}
					/>
				</div>
				<div className="sm:col-span-6">
					<ul role="list" className="divide-y divide-slate-100">
						{vetToVetClinicRelationships.fields.map((vetToVetClinicRelationship, index) => (
							<li
								key={vetToVetClinicRelationship.id}
								className="flex max-w-full items-center justify-between gap-x-6 py-4"
							>
								<div className="flex items-center gap-x-4">
									<div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
										<UserCircleIcon className="h-5 w-5" />
									</div>

									<div className="min-w-0 flex-auto truncate">
										<p className="text-sm font-semibold leading-6 text-slate-900">
											{vetToVetClinicRelationship.vet.givenName} {vetToVetClinicRelationship.vet.familyName}
										</p>
										<p className="truncate text-xs leading-5 text-slate-500">
											{vetToVetClinicRelationship.vet.emailAddress}
										</p>
									</div>
								</div>

								<div className="flex space-x-4">
									<FormField
										control={control}
										name={`vetToVetClinicRelationships.${index}.relationship`}
										rules={{ required: "Please select a relationship" }}
										defaultValue={vetToVetClinicRelationship.relationship}
										render={({ field }) => (
											<FormItem>
												<Select
													onValueChange={(value) => {
														field.onChange(value as typeof field.value);
														setValue(`actions.vetToVetClinicRelationships.${vetToVetClinicRelationship.id}`, {
															type: "UPDATE",
															payload: {
																...vetToVetClinicRelationship,
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
													<SelectContent withoutPortal>
														<SelectGroup>
															<SelectLabel>Relationships</SelectLabel>
															{Object.values(InsertVetToVetClinicRelationshipSchema.shape.relationship.Values).map(
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
											<DropdownMenuContent withoutPortal>
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onSelect={() => {
														setEditingVet(vetToVetClinicRelationship.vet);
													}}
												>
													<EditIcon className="mr-2 h-4 w-4" />
													<span>Edit Vet Clinic</span>
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={() => {
														toggleVetToVetClinicRelationship(vetToVetClinicRelationship.vet);
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

export { VetClinicToVetRelationships };
