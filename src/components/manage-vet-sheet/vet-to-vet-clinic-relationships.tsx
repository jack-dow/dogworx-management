"use client";

import * as React from "react";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

import { ManageVetClinicSheet } from "~/components/manage-vet-clinic-sheet";
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
import { RelationshipLoadingSkeleton } from "../relationship-loading-skeleton";
import { type ExistingVet, type ManageVetSheetFormSchema } from "./manage-vet-sheet";

type VetClinic = ManageVetSheetFormSchema["vetToVetClinicRelationships"][number]["vetClinic"];

function VetToVetClinicRelationships({
	control,
	existingVetToVetClinicRelationships,
	isLoading,
}: {
	control: Control<ManageVetSheetFormSchema>;
	existingVetToVetClinicRelationships: ExistingVet["vetToVetClinicRelationships"] | undefined;
	isLoading: boolean;
}) {
	const { setValue, getValues } = useFormContext<ManageVetSheetFormSchema>();

	const vetToVetClinicRelationships = useFieldArray({
		control,
		name: "vetToVetClinicRelationships",
		keyName: "rhf-id",
	});

	const [editingVetClinic, setEditingVetClinic] = React.useState<VetClinic | null>(null);
	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);
	const [isCreateVetClinicSheetOpen, setIsCreateVetClinicSheetOpen] = React.useState(false);

	const searchVetClinicsComboboxTriggerRef = React.useRef<HTMLButtonElement>(null);

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
			searchVetClinicsComboboxTriggerRef?.current?.focus();
		}, 0);
	}

	function toggleVetToVetClinicRelationship(vetClinic: VetClinic) {
		const relationshipId = vetToVetClinicRelationships.fields.find(
			(vetClinicRelationship) => vetClinicRelationship.vetClinicId === vetClinic.id,
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

			return;
		}
		const id = generateId();

		vetToVetClinicRelationships.append({
			id,
			vetId: getValues("id"),
			vetClinicId: vetClinic.id,
			relationship: "full-time",
			vetClinic,
		});

		setValue("actions.vetToVetClinicRelationships", {
			...getValues("actions.vetToVetClinicRelationships"),
			[id]: {
				type: "INSERT",
				payload: {
					id,
					vetId: getValues("id"),
					vetClinicId: vetClinic.id,
					relationship: "full-time",
				},
			},
		});
	}

	return (
		<>
			<ManageVetClinicSheet
				vetClinic={editingVetClinic ?? undefined}
				open={!!editingVetClinic}
				setOpen={() => setEditingVetClinic(null)}
				withoutTrigger
			/>

			<DestructiveActionDialog
				title="Are you sure?"
				description="Once you save this vet, this relationship will be permanently deleted."
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
					<h3 className="text-base font-semibold leading-7 text-slate-900">Vet Clinics</h3>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">
						Manage the relationships between this vet and their vet clinics.
					</p>
				</div>
				<div className="sm:col-span-6">
					<SearchCombobox
						withinSheet
						disabled={isLoading}
						ref={searchVetClinicsComboboxTriggerRef}
						labelText="Search Vet Clinics"
						triggerText={
							vetToVetClinicRelationships.fields.length === 0
								? "Search vet clinics"
								: vetToVetClinicRelationships.fields.length === 1
								? "1 vet clinic selected"
								: `${vetToVetClinicRelationships.fields.length} vet clinics selected`
						}
						onSearch={async (searchTerm) => {
							try {
								const res = await api.vetClinics.search(searchTerm);

								return res.data ?? [];
							} catch (error) {
								console.log("Error fetching data:", error);
								return [];
							}
						}}
						selected={vetToVetClinicRelationships.fields.map(
							(vetClinicRelationship) => vetClinicRelationship.vetClinic,
						)}
						onSelect={(vetClinic) => {
							toggleVetToVetClinicRelationship(vetClinic);
						}}
						renderResultItemText={(vetClinic) => vetClinic.name}
						renderNoResultActions={({ searchTerm, setConfirmedNoResults, inputRef, results, setResults }) => (
							<>
								<ManageVetClinicSheet
									open={isCreateVetClinicSheetOpen}
									setOpen={(value) => {
										setIsCreateVetClinicSheetOpen(value);

										if (value === false) {
											// HACK: Focus the input after the sheet closes
											setTimeout(() => {
												inputRef?.current?.focus();
											}, 0);
										}
									}}
									defaultValues={{
										name: searchTerm,
									}}
									onSuccessfulSubmit={(vetClinic) => {
										toggleVetToVetClinicRelationship(vetClinic);
										setResults([...results, vetClinic]);
										setConfirmedNoResults(false);
										inputRef?.current?.focus();
									}}
									withoutTrigger
								/>

								<SearchNoResultActionItem
									onSelect={() => {
										setIsCreateVetClinicSheetOpen(true);
									}}
								>
									<UserPlusIcon className="mr-2 h-4 w-4" />
									<span>Create new vet clinic &quot;{searchTerm}&quot;</span>
								</SearchNoResultActionItem>
							</>
						)}
					/>
				</div>
				<div className="sm:col-span-6">
					<ul role="list" className="divide-y divide-slate-100">
						{isLoading
							? Array(1)
									.fill(undefined)
									.map((_, index) => (
										<li key={`v-t-vc-${index}`}>
											<RelationshipLoadingSkeleton />
										</li>
									))
							: vetToVetClinicRelationships.fields.map((vetToVetClinicRelationship, index) => (
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
													{vetToVetClinicRelationship.vetClinic.name}
												</p>
												<p className="truncate text-xs leading-5 text-slate-500">
													{vetToVetClinicRelationship.vetClinic.emailAddress}
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
															onSelect={(e) => {
																e.preventDefault();
																setEditingVetClinic(vetToVetClinicRelationship.vetClinic);
															}}
														>
															<EditIcon className="mr-2 h-4 w-4" />
															<span>Edit Vet Clinic</span>
														</DropdownMenuItem>
														<DropdownMenuItem
															onSelect={() => {
																toggleVetToVetClinicRelationship(vetToVetClinicRelationship.vetClinic);
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

export { VetToVetClinicRelationships };
