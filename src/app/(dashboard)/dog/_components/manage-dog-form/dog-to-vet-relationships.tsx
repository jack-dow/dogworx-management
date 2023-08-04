"use client";

import * as React from "react";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

import { ManageVet } from "~/components/manage-vet";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FormControl, FormField, FormGroup, FormItem, FormMessage } from "~/components/ui/form";
import {
	EditIcon,
	EllipsisVerticalIcon,
	EnvelopeIcon,
	PhoneIcon,
	TrashIcon,
	UserCircleIcon,
	UserPlusIcon,
} from "~/components/ui/icons";
import { Loader } from "~/components/ui/loader";
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
import { useToast } from "~/components/ui/use-toast";
import { actions, type DogById, type VetById, type VetsSearch } from "~/actions";
import { InsertDogToVetRelationshipSchema } from "~/db/validation";
import { generateId } from "~/utils";
import { type ManageDogFormSchema } from "./manage-dog-form";

function DogToVetRelationships({
	control,
	existingDogToVetRelationships,
}: {
	control: Control<ManageDogFormSchema>;
	existingDogToVetRelationships: DogById["dogToVetRelationships"] | undefined;
}) {
	const form = useFormContext<ManageDogFormSchema>();

	const dogToVetRelationships = useFieldArray({
		control,
		name: "dogToVetRelationships",
		keyName: "rhf-id",
	});

	const [editingVet, setEditingVet] = React.useState<VetById | null>(null);
	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);
	const [isCreateVetSheetOpen, setIsCreateVetSheetOpen] = React.useState(false);

	const searchVetsComboboxTriggerRef = React.useRef<HTMLButtonElement>(null);

	function handleDogToVetRelationshipDelete(relationshipId: string) {
		const dogToVetRelationshipActions = { ...form.getValues("actions.dogToVetRelationships") };

		dogToVetRelationships.remove(dogToVetRelationships.fields.findIndex((field) => field.id === relationshipId));

		if (dogToVetRelationshipActions[relationshipId]?.type === "INSERT") {
			delete dogToVetRelationshipActions[relationshipId];
		} else {
			dogToVetRelationshipActions[relationshipId] = {
				type: "DELETE",
				payload: relationshipId,
			};
		}

		form.setValue("actions.dogToVetRelationships", dogToVetRelationshipActions);

		// HACK: Focus the combobox trigger after the dialog closes
		setTimeout(() => {
			searchVetsComboboxTriggerRef?.current?.focus();
		}, 0);
	}

	function toggleDogToVetRelationship(vet: VetsSearch[number]) {
		const relationshipId = dogToVetRelationships.fields.find((vetRelationship) => vetRelationship.vetId === vet.id)?.id;

		if (relationshipId) {
			const existingDogToVetRelationship = existingDogToVetRelationships?.find(
				(dogToVetRelationship) => dogToVetRelationship.id === relationshipId,
			);
			if (existingDogToVetRelationship) {
				setConfirmRelationshipDelete(existingDogToVetRelationship.id);
			} else {
				handleDogToVetRelationshipDelete(relationshipId);
			}

			return;
		}

		const id = generateId();

		dogToVetRelationships.append({
			id,
			dogId: form.getValues("id"),
			vetId: vet.id,
			relationship: "primary",
			vet,
		});

		form.setValue("actions.dogToVetRelationships", {
			...form.getValues("actions.dogToVetRelationships"),
			[id]: {
				type: "INSERT",
				payload: {
					id,
					dogId: form.getValues("id"),
					vetId: vet.id,
					relationship: "primary",
				},
			},
		});
	}

	return (
		<>
			<ManageVet
				variant="sheet"
				vet={editingVet ?? undefined}
				open={!!editingVet}
				setOpen={() => setEditingVet(null)}
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
						handleDogToVetRelationshipDelete(confirmRelationshipDelete);
					}
				}}
			/>

			<FormGroup title="Vets" description="Manage the relationships between this dog and vets.">
				<div className="sm:col-span-6">
					<SearchCombobox
						ref={searchVetsComboboxTriggerRef}
						labelText="Search Vets"
						triggerText={
							dogToVetRelationships.fields.length === 0
								? "Search Vets"
								: dogToVetRelationships.fields.length === 1
								? "1 vet selected"
								: `${dogToVetRelationships.fields.length} vets selected`
						}
						onSearch={async (searchTerm) => {
							try {
								const res = await actions.app.vets.search(searchTerm);

								return res.data ?? [];
							} catch {
								return [];
							}
						}}
						selected={dogToVetRelationships.fields.map((vetRelationship) => vetRelationship.vet)}
						onSelect={(vet) => {
							toggleDogToVetRelationship(vet);
						}}
						renderResultItemText={(vet) => `${vet.givenName} ${vet.familyName}`}
						renderNoResultActions={({ searchTerm, setConfirmedNoResults, inputRef, results, setResults }) => (
							<>
								<ManageVet
									variant="sheet"
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
										givenName:
											searchTerm.split(" ").length === 1 ? searchTerm : searchTerm.split(" ").slice(0, -1).join(" "),
										familyName: searchTerm.split(" ").length > 1 ? searchTerm.split(" ").pop() : undefined,
									}}
									onSuccessfulSubmit={(vet) => {
										toggleDogToVetRelationship(vet);
										setResults([...results, vet]);
										setConfirmedNoResults(false);
										inputRef?.current?.focus();
									}}
									withoutTrigger
								/>

								<SearchComboboxItem
									onSelect={() => {
										setIsCreateVetSheetOpen(true);
									}}
								>
									<UserPlusIcon className="mr-2 h-4 w-4" />
									<span>Create new vet {searchTerm && `"${searchTerm}"`} </span>
								</SearchComboboxItem>
							</>
						)}
					/>
				</div>
				<div className="sm:col-span-6">
					<ul role="list" className="divide-y divide-slate-100">
						{dogToVetRelationships.fields.map((dogToVetRelationship, index) => (
							<DogToVetRelationship
								key={dogToVetRelationship.id}
								dogToVetRelationship={dogToVetRelationship}
								index={index}
								onEdit={(vet) => {
									setEditingVet(vet);
								}}
								onDelete={(vet) => toggleDogToVetRelationship(vet)}
							/>
						))}
					</ul>
				</div>
			</FormGroup>
		</>
	);
}

function DogToVetRelationship({
	dogToVetRelationship,
	index,
	onEdit,
	onDelete,
}: {
	dogToVetRelationship: ManageDogFormSchema["dogToVetRelationships"][number];
	index: number;
	onEdit: (vet: VetById) => void;
	onDelete: (vet: VetsSearch[number]) => void;
}) {
	const { toast } = useToast();
	const form = useFormContext<ManageDogFormSchema>();

	const [isFetchingVet, setIsFetchingVet] = React.useState(false);
	return (
		<li key={dogToVetRelationship.id} className="flex max-w-full items-center justify-between gap-x-6 py-4">
			<div className="flex items-center gap-x-4">
				<div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
					<UserCircleIcon className="h-5 w-5" />
				</div>

				<div className="min-w-0 flex-auto truncate">
					<p className="text-sm font-semibold leading-6 text-slate-900">
						{dogToVetRelationship.vet.givenName} {dogToVetRelationship.vet.familyName}
					</p>
					<div className="flex space-x-2 truncate">
						{dogToVetRelationship.vet.emailAddress && (
							<p className="flex items-center truncate text-xs leading-5 text-slate-500">
								<EnvelopeIcon className="mr-1 h-3 w-3" />
								{dogToVetRelationship.vet.emailAddress}
							</p>
						)}
						{dogToVetRelationship.vet.emailAddress && dogToVetRelationship.vet.phoneNumber && (
							<span aria-hidden="true">&middot;</span>
						)}
						{dogToVetRelationship.vet.phoneNumber && (
							<p className="flex items-center truncate text-xs leading-5 text-slate-500">
								<PhoneIcon className="mr-1 h-3 w-3" />
								{dogToVetRelationship.vet.phoneNumber}
							</p>
						)}
					</div>
				</div>
			</div>

			<div className="flex space-x-4">
				<FormField
					control={form.control}
					name={`dogToVetRelationships.${index}.relationship`}
					rules={{ required: "Please select a relationship" }}
					defaultValue={dogToVetRelationship.relationship}
					render={({ field }) => (
						<FormItem>
							<Select
								onValueChange={(value) => {
									field.onChange(value as typeof field.value);

									const existingAction = form.getValues(`actions.dogToVetRelationships.${dogToVetRelationship.id}`);

									if (existingAction.type === "INSERT") {
										form.setValue(`actions.dogToVetRelationships.${dogToVetRelationship.id}`, {
											type: "INSERT",
											payload: {
												...existingAction.payload,
												relationship: value as typeof field.value,
											},
										});
										return;
									}

									form.setValue(`actions.dogToVetRelationships.${dogToVetRelationship.id}`, {
										type: "UPDATE",
										payload: {
											...dogToVetRelationship,
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
										{Object.values(InsertDogToVetRelationshipSchema.shape.relationship.Values).map((relation) => (
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
						<DropdownMenuContent>
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();

									const renderErrorToast = () => {
										toast({
											title: "Failed to fetch vet",
											description: "Something went wrong while fetching the vet. Please try again",
											variant: "destructive",
										});
									};

									setIsFetchingVet(true);

									actions.app.vets
										.byId(dogToVetRelationship.vet.id)
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
											setIsFetchingVet(false);
										});
								}}
							>
								<EditIcon className="mr-2 h-4 w-4" />
								<span className="flex-1">Edit Vet</span>
								{isFetchingVet && <Loader size="sm" variant="black" className="mr-0" />}
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => {
									onDelete(dogToVetRelationship.vet);
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

export { DogToVetRelationships };
