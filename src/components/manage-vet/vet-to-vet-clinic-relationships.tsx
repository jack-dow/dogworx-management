"use client";

import * as React from "react";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FormControl, FormField, FormGroup, FormItem, FormMessage, FormSheetGroup } from "~/components/ui/form";
import {
	EditIcon,
	EllipsisVerticalIcon,
	EnvelopeIcon,
	PhoneIcon,
	TrashIcon,
	UserCircleIcon,
	UserPlusIcon,
} from "~/components/ui/icons";
import { SearchCombobox, SearchComboboxItem } from "~/components/ui/search-combobox";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { actions, type VetById, type VetClinicById, type VetClinicsSearch } from "~/actions";
import { InsertVetToVetClinicRelationshipSchema } from "~/db/validation";
import { generateId } from "~/utils";
import { ManageVetClinic } from "../manage-vet-clinic";
import { Loader } from "../ui/loader";
import { useToast } from "../ui/use-toast";
import { type ManageVetFormSchemaType } from "./manage-vet";

function VetToVetClinicRelationships({
	control,
	existingVetToVetClinicRelationships,
	variant,
}: {
	control: Control<ManageVetFormSchemaType>;
	existingVetToVetClinicRelationships: VetById["vetToVetClinicRelationships"] | undefined;
	variant: "sheet" | "form";
}) {
	const form = useFormContext<ManageVetFormSchemaType>();

	const vetToVetClinicRelationships = useFieldArray({
		control,
		name: "vetToVetClinicRelationships",
		keyName: "rhf-id",
	});

	const [editingVetClinic, setEditingVetClinic] = React.useState<VetClinicById | null>(null);
	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);
	const [isCreateVetClinicSheetOpen, setIsCreateVetClinicSheetOpen] = React.useState(false);

	const searchVetClinicsComboboxTriggerRef = React.useRef<HTMLButtonElement>(null);

	function handleVetToVetClinicRelationshipDelete(relationshipId: string) {
		const vetToVetClinicRelationshipActions = { ...form.getValues("actions.vetToVetClinicRelationships") };

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

		form.setValue("actions.vetToVetClinicRelationships", vetToVetClinicRelationshipActions);

		// HACK: Focus the button after the dialog closes
		setTimeout(() => {
			searchVetClinicsComboboxTriggerRef?.current?.focus();
		}, 0);
	}

	function toggleVetToVetClinicRelationship(vetClinic: VetClinicsSearch[number]) {
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
			vetId: form.getValues("id"),
			vetClinicId: vetClinic.id,
			relationship: "full-time",
			vetClinic,
		});

		form.setValue("actions.vetToVetClinicRelationships", {
			...form.getValues("actions.vetToVetClinicRelationships"),
			[id]: {
				type: "INSERT",
				payload: {
					id,
					vetId: form.getValues("id"),
					vetClinicId: vetClinic.id,
					relationship: "full-time",
				},
			},
		});
	}

	const FieldsWrapper = variant === "sheet" ? FormSheetGroup : FormGroup;

	return (
		<>
			<ManageVetClinic
				variant="sheet"
				vetClinic={editingVetClinic ?? undefined}
				open={!!editingVetClinic}
				setOpen={() => setEditingVetClinic(null)}
				withoutTrigger
			/>

			<DestructiveActionDialog
				name="relationship"
				requiresSaveOf="vet"
				withoutTrigger
				open={!!confirmRelationshipDelete}
				onOpenChange={() => setConfirmRelationshipDelete(null)}
				onConfirm={() => {
					if (confirmRelationshipDelete) {
						handleVetToVetClinicRelationshipDelete(confirmRelationshipDelete);
					}
				}}
			/>

			<FieldsWrapper title="Vet Clinics" description="Manage the relationships between this vet and their vet clinics.">
				<div className="sm:col-span-6">
					<SearchCombobox
						withinSheet
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
								const res = await actions.app.vetClinics.search(searchTerm);

								return res.data ?? [];
							} catch {
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
								<ManageVetClinic
									variant="sheet"
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

								<SearchComboboxItem
									onSelect={() => {
										setIsCreateVetClinicSheetOpen(true);
									}}
								>
									<UserPlusIcon className="mr-2 h-4 w-4" />
									<span>Create new vet clinic {searchTerm && `"${searchTerm}"`} </span>
								</SearchComboboxItem>
							</>
						)}
					/>
				</div>
				<div className="sm:col-span-6">
					<ul role="list" className="divide-y divide-slate-100">
						{vetToVetClinicRelationships.fields.map((vetToVetClinicRelationship, index) => (
							<VetToVetClinicRelationship
								key={vetToVetClinicRelationship.id}
								vetToVetClinicRelationship={vetToVetClinicRelationship}
								index={index}
								onEdit={(vetClinic) => {
									setEditingVetClinic(vetClinic);
								}}
								onDelete={(vetClinic) => toggleVetToVetClinicRelationship(vetClinic)}
							/>
						))}
					</ul>
				</div>
			</FieldsWrapper>
		</>
	);
}

function VetToVetClinicRelationship({
	vetToVetClinicRelationship,
	index,
	onEdit,
	onDelete,
}: {
	vetToVetClinicRelationship: ManageVetFormSchemaType["vetToVetClinicRelationships"][number];
	index: number;
	onEdit: (vetClinic: VetClinicById) => void;
	onDelete: (vetClinic: VetClinicsSearch[number]) => void;
}) {
	const { toast } = useToast();
	const form = useFormContext<ManageVetFormSchemaType>();

	const [isFetchingVetClinic, setIsFetchingVetClinic] = React.useState(false);
	return (
		<li className="flex max-w-full items-center justify-between gap-x-6 py-4">
			<div className="flex items-center gap-x-4">
				<div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
					<UserCircleIcon className="h-5 w-5" />
				</div>

				<div className="min-w-0 flex-auto truncate">
					<p className="text-sm font-semibold leading-6 text-slate-900">{vetToVetClinicRelationship.vetClinic.name}</p>
					<div>
						{vetToVetClinicRelationship.vetClinic.emailAddress && (
							<p className="flex items-center truncate text-xs leading-5 text-slate-500">
								<EnvelopeIcon className="mr-1 h-3 w-3" />
								{vetToVetClinicRelationship.vetClinic.emailAddress}
							</p>
						)}

						{vetToVetClinicRelationship.vetClinic.phoneNumber && (
							<p className="flex items-center truncate text-xs leading-5 text-slate-500">
								<PhoneIcon className="mr-1 h-3 w-3" />
								{vetToVetClinicRelationship.vetClinic.phoneNumber}
							</p>
						)}
					</div>
				</div>
			</div>

			<div className="flex space-x-4">
				<FormField
					control={form.control}
					name={`vetToVetClinicRelationships.${index}.relationship`}
					rules={{ required: "Please select a relationship" }}
					defaultValue={vetToVetClinicRelationship.relationship}
					render={({ field }) => (
						<FormItem>
							<Select
								onValueChange={(value) => {
									field.onChange(value as typeof field.value);

									const existingAction = form.getValues(
										`actions.vetToVetClinicRelationships.${vetToVetClinicRelationship.id}`,
									);

									if (existingAction?.type === "INSERT") {
										form.setValue(`actions.vetToVetClinicRelationships.${vetToVetClinicRelationship.id}`, {
											type: "INSERT",
											payload: {
												...existingAction.payload,
												relationship: value as typeof field.value,
											},
										});
										return;
									}

									form.setValue(`actions.vetToVetClinicRelationships.${vetToVetClinicRelationship.id}`, {
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
										{Object.values(InsertVetToVetClinicRelationshipSchema.shape.relationship.Values).map((relation) => (
											<SelectItem key={relation} value={relation} className="capitalize">
												{relation.split("-").join(" ")}
											</SelectItem>
										))}
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

									const renderErrorToast = () => {
										toast({
											title: "Failed to fetch vet clinic",
											description: "Something went wrong while fetching the vet clinic. Please try again",
											variant: "destructive",
										});
									};

									setIsFetchingVetClinic(true);

									actions.app.vetClinics
										.byId(vetToVetClinicRelationship.vetClinic.id)
										.then((result) => {
											if (result.success && result.data) {
												onEdit(result.data);
												return;
											}

											renderErrorToast();
										})
										.catch(() => {
											renderErrorToast();
										})
										.finally(() => {
											setIsFetchingVetClinic(false);
										});
								}}
							>
								<EditIcon className="mr-2 h-4 w-4" />
								<span className="flex-1">Edit Vet Clinic</span>
								{isFetchingVetClinic && <Loader size="sm" variant="black" className="mr-0" />}
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => {
									onDelete(vetToVetClinicRelationship.vetClinic);
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
	);
}

export { VetToVetClinicRelationships };
