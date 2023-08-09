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
import {
	MultiSelectSearchCombobox,
	MultiSelectSearchComboboxAction,
} from "~/components/ui/multi-select-search-combobox";
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
import { cn, generateId } from "~/utils";
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
	const [isCreateVetSheetOpen, setIsCreateVetSheetOpen] = React.useState<string | null>(null);

	const searchVetsInputRef = React.useRef<HTMLInputElement>(null);

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

		// HACK: Focus the combobox input after the dialog closes
		setTimeout(() => {
			searchVetsInputRef?.current?.focus();
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
				onSuccessfulSubmit={(vet) => {
					dogToVetRelationships.fields.forEach((field, index) => {
						if (field.vetId === vet.id) {
							form.setValue(`dogToVetRelationships.${index}.vet`, vet);
						}
					});
				}}
			/>

			<DestructiveActionDialog
				name="relationship"
				requiresSaveOf="dog"
				withoutTrigger
				open={!!confirmRelationshipDelete}
				onOpenChange={() => setConfirmRelationshipDelete(null)}
				onConfirm={() => {
					if (confirmRelationshipDelete) {
						handleDogToVetRelationshipDelete(confirmRelationshipDelete);
					}
				}}
			/>

			<FormGroup title="Vets" description="Manage the relationships between this dog and vets.">
				{isCreateVetSheetOpen !== null && (
					<ManageVet
						variant="sheet"
						open={true}
						setOpen={() => {
							setIsCreateVetSheetOpen(null);

							// HACK: Focus the input after the sheet closes
							setTimeout(() => {
								searchVetsInputRef?.current?.focus();
							}, 0);
						}}
						defaultValues={{
							givenName:
								isCreateVetSheetOpen.split(" ").length === 1
									? isCreateVetSheetOpen
									: isCreateVetSheetOpen.split(" ").slice(0, -1).join(" "),
							familyName:
								isCreateVetSheetOpen.split(" ").length > 1 ? isCreateVetSheetOpen.split(" ").pop() : undefined,
						}}
						onSuccessfulSubmit={(vet) => {
							toggleDogToVetRelationship(vet);
							searchVetsInputRef?.current?.focus();
						}}
						withoutTrigger
					/>
				)}

				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchVetsInputRef}
						resultLabel={(result) => `${result.givenName} ${result.familyName}`}
						selected={dogToVetRelationships.fields.map((dogToVetRelationship) => dogToVetRelationship.vet)}
						onSelect={(vet) => {
							toggleDogToVetRelationship(vet);
						}}
						onSearch={async (searchTerm) => {
							const res = await actions.app.vets.search(searchTerm);

							return res.data ?? [];
						}}
						placeholder={
							dogToVetRelationships.fields.length === 0
								? "Search vets..."
								: dogToVetRelationships.fields.length === 1
								? "1 vet selected"
								: `${dogToVetRelationships.fields.length} vets selected`
						}
						renderActions={({ searchTerm }) => (
							<MultiSelectSearchComboboxAction
								onSelect={() => {
									setIsCreateVetSheetOpen(searchTerm);
								}}
							>
								<UserPlusIcon className="mr-2 h-4 w-4" />
								<span className="truncate">Create new vet {searchTerm && `"${searchTerm}"`} </span>
							</MultiSelectSearchComboboxAction>
						)}
					/>
				</div>

				{dogToVetRelationships.fields.length > 0 && (
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
				)}
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
		<li
			key={dogToVetRelationship.id}
			className={cn("flex items-center justify-between gap-x-6", index === 0 ? "pb-4" : "py-4")}
		>
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

									if (existingAction?.type === "INSERT") {
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
								{isFetchingVet && <Loader size="sm" variant="black" className="ml-2 mr-0" />}
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
