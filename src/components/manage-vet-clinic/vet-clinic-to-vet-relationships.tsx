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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { actions, type VetById, type VetClinicById, type VetsSearch } from "~/actions";
import { InsertVetToVetClinicRelationshipSchema } from "~/db/validation";
import { cn, generateId } from "~/utils";
import { ManageVet } from "../manage-vet";
import { Loader } from "../ui/loader";
import { MultiSelectSearchCombobox, MultiSelectSearchComboboxAction } from "../ui/multi-select-search-combobox";
import { useToast } from "../ui/use-toast";
import { type ManageVetClinicFormSchemaType } from "./manage-vet-clinic";

function VetClinicToVetRelationships({
	control,
	existingVetToVetClinicRelationships,
	variant,
}: {
	control: Control<ManageVetClinicFormSchemaType>;
	existingVetToVetClinicRelationships: VetClinicById["vetToVetClinicRelationships"] | undefined;
	variant: "sheet" | "form";
}) {
	const form = useFormContext<ManageVetClinicFormSchemaType>();

	const vetToVetClinicRelationships = useFieldArray({
		control,
		name: "vetToVetClinicRelationships",
		keyName: "rhf-id",
	});

	const [editingVet, setEditingVet] = React.useState<VetById | null>(null);
	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);
	const [isCreateVetSheetOpen, setIsCreateVetSheetOpen] = React.useState<string | null>(null);

	const searchVetsInputRef = React.useRef<HTMLInputElement>(null);

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
			searchVetsInputRef?.current?.focus();
		}, 0);
	}

	function toggleVetToVetClinicRelationship(vet: VetsSearch[number]) {
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

			return;
		}

		const id = generateId();

		vetToVetClinicRelationships.append({
			id,
			vetId: vet.id,
			vetClinicId: form.getValues("id"),
			relationship: "full-time",
			vet,
		});

		form.setValue("actions.vetToVetClinicRelationships", {
			...form.getValues("actions.vetToVetClinicRelationships"),
			[id]: {
				type: "INSERT",
				payload: {
					id,
					vetClinicId: form.getValues("id"),
					vetId: vet.id,
					relationship: "full-time",
				},
			},
		});
	}

	const FieldsWrapper = variant === "sheet" ? FormSheetGroup : FormGroup;

	return (
		<>
			<ManageVet
				variant="sheet"
				vet={editingVet ?? undefined}
				open={!!editingVet}
				setOpen={() => setEditingVet(null)}
				withoutTrigger
				onSuccessfulSubmit={(vet) => {
					vetToVetClinicRelationships.fields.forEach((field, index) => {
						if (field.vetId === vet.id) {
							form.setValue(`vetToVetClinicRelationships.${index}.vet`, vet);
						}
					});
				}}
			/>

			<DestructiveActionDialog
				name="relationship"
				requiresSaveOf="vet clinic"
				withoutTrigger
				open={!!confirmRelationshipDelete}
				onOpenChange={() => setConfirmRelationshipDelete(null)}
				onConfirm={() => {
					if (confirmRelationshipDelete) {
						handleVetToVetClinicRelationshipDelete(confirmRelationshipDelete);
					}
				}}
			/>

			<FieldsWrapper title="Vets" description="Manage the relationships between this vet clinic and their vets.">
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
							toggleVetToVetClinicRelationship(vet);
							searchVetsInputRef?.current?.focus();
						}}
						withoutTrigger
					/>
				)}

				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchVetsInputRef}
						resultLabel={(result) => `${result.givenName} ${result.familyName}`}
						selected={vetToVetClinicRelationships.fields.map(
							(vetToVetClinicRelationship) => vetToVetClinicRelationship.vet,
						)}
						onSelect={(vet) => {
							toggleVetToVetClinicRelationship(vet);
						}}
						onSearch={async (searchTerm) => {
							const res = await actions.app.vets.search(searchTerm);

							return res.data ?? [];
						}}
						placeholder={
							vetToVetClinicRelationships.fields.length === 0
								? "Search vets..."
								: vetToVetClinicRelationships.fields.length === 1
								? "1 vet selected"
								: `${vetToVetClinicRelationships.fields.length} vets selected`
						}
						renderActions={({ searchTerm }) => (
							<MultiSelectSearchComboboxAction
								onSelect={() => {
									setIsCreateVetSheetOpen(searchTerm);
								}}
							>
								<UserPlusIcon className="mr-2 h-4 w-4" />
								<span>Create new vet {searchTerm && `"${searchTerm}"`} </span>
							</MultiSelectSearchComboboxAction>
						)}
					/>
				</div>

				{vetToVetClinicRelationships.fields.length > 0 && (
					<div className="sm:col-span-6">
						<ul role="list" className="divide-y divide-slate-100">
							{vetToVetClinicRelationships.fields.map((vetToVetClinicRelationship, index) => (
								<VetClinicToVetRelationship
									key={vetToVetClinicRelationship.id}
									vetToVetClinicRelationship={vetToVetClinicRelationship}
									index={index}
									onEdit={(vetClinic) => {
										setEditingVet(vetClinic);
									}}
									onDelete={(vetClinic) => toggleVetToVetClinicRelationship(vetClinic)}
									variant={variant}
								/>
							))}
						</ul>
					</div>
				)}
			</FieldsWrapper>
		</>
	);
}

function VetClinicToVetRelationship({
	vetToVetClinicRelationship,
	index,
	onEdit,
	onDelete,
	variant,
}: {
	vetToVetClinicRelationship: ManageVetClinicFormSchemaType["vetToVetClinicRelationships"][number];
	index: number;
	onEdit: (vet: VetById) => void;
	onDelete: (vet: VetsSearch[number]) => void;
	variant: "sheet" | "form";
}) {
	const { toast } = useToast();
	const form = useFormContext<ManageVetClinicFormSchemaType>();

	const [isFetchingVet, setIsFetchingVet] = React.useState(false);
	return (
		<li
			key={vetToVetClinicRelationship.id}
			className={cn("flex items-center justify-between gap-x-6", index === 0 ? "pb-4" : "py-4")}
		>
			<div className="flex items-center gap-x-4">
				<div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
					<UserCircleIcon className="h-5 w-5" />
				</div>

				<div className="min-w-0 flex-auto truncate">
					<p className="text-sm font-semibold leading-6 text-slate-900">
						{vetToVetClinicRelationship.vet.givenName} {vetToVetClinicRelationship.vet.familyName}
					</p>
					<div>
						{vetToVetClinicRelationship.vet.emailAddress && (
							<p className="flex items-center truncate text-xs leading-5 text-slate-500">
								<EnvelopeIcon className="mr-1 h-3 w-3" />
								{vetToVetClinicRelationship.vet.emailAddress}
							</p>
						)}

						{vetToVetClinicRelationship.vet.phoneNumber && (
							<p className="flex items-center truncate text-xs leading-5 text-slate-500">
								<PhoneIcon className="mr-1 h-3 w-3" />
								{vetToVetClinicRelationship.vet.phoneNumber}
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
						<DropdownMenuContent
							withoutPortal
							align={variant == "sheet" ? "start" : "center"}
							alignOffset={variant === "sheet" ? -114 : 0}
						>
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
										.byId(vetToVetClinicRelationship.vet.id)
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
								<span className="flex-1">Edit</span>
								{isFetchingVet && <Loader size="sm" variant="black" className="ml-2 mr-0" />}
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => {
									onDelete(vetToVetClinicRelationship.vet);
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

export { VetClinicToVetRelationships };
