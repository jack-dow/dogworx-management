"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { ManageVetSheet } from "~/components/manage-vet/manage-vet-sheet";
import { ClickToCopy } from "~/components/ui/click-to-copy";
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
import { InsertDogToVetRelationshipSchema } from "~/db/validation/app";
import { cn, generateId, logInDevelopment } from "~/lib/client-utils";
import { api } from "~/lib/trpc/client";
import { type RouterOutputs } from "~/server";
import { type ManageDogFormSchema } from "./manage-dog-form";

type VetById = NonNullable<RouterOutputs["app"]["vets"]["byId"]["data"]>;

function DogToVetRelationships({ isNew }: { isNew: boolean }) {
	const { toast } = useToast();
	const form = useFormContext<ManageDogFormSchema>();

	const dogToVetRelationships = useFieldArray({
		control: form.control,
		name: "dogToVetRelationships",
		keyName: "rhf-id",
	});

	const [editingVet, setEditingVet] = React.useState<VetById | null>(null);
	const [isCreateVetSheetOpen, setIsCreateVetSheetOpen] = React.useState<true | string | null>(null);

	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);

	const searchVetsInputRef = React.useRef<HTMLInputElement>(null);

	const context = api.useContext();

	const insertDogToVetRelationshipMutation = api.app.dogs.dogToVetRelationships.insert.useMutation();
	const deleteDogToVetRelationshipMutation = api.app.dogs.dogToVetRelationships.delete.useMutation();

	return (
		<>
			<ManageVetSheet
				withoutTrigger
				open={!!editingVet}
				setOpen={(value) => {
					if (value === false) {
						setEditingVet(null);
					}
				}}
				vet={editingVet ?? undefined}
				onSuccessfulSubmit={(vet) => {
					const newDogToVetRelationships = [...dogToVetRelationships.fields].map((field) => {
						if (field.vetId === vet.id) {
							return {
								...field,
								vet: {
									...field.vet,
									...vet,
								},
							};
						}

						return field;
					});

					form.setValue("dogToVetRelationships", newDogToVetRelationships, { shouldDirty: false });
				}}
				onDelete={(id) => {
					form.setValue(
						"dogToVetRelationships",
						dogToVetRelationships.fields.filter((relationship) => relationship.vetId !== id),
						{ shouldDirty: false },
					);
				}}
			/>

			<DestructiveActionDialog
				withoutTrigger
				open={!!confirmRelationshipDelete}
				onOpenChange={() => {
					setConfirmRelationshipDelete(null);
				}}
				name="relationship"
				onConfirm={async () => {
					if (confirmRelationshipDelete) {
						try {
							if (!isNew) {
								await deleteDogToVetRelationshipMutation.mutateAsync({
									id: confirmRelationshipDelete,
								});
							}

							// Use setValue instead of remove so that we can set shouldDirty to false
							form.setValue(
								"dogToVetRelationships",
								dogToVetRelationships.fields.filter((relationship) => relationship.id !== confirmRelationshipDelete),
								{ shouldDirty: false },
							);

							toast({
								title: "Deleted relationship",
								description: "The relationship has been successfully deleted.",
							});

							setConfirmRelationshipDelete(null);

							// HACK: Focus the combobox trigger after the dialog closes
							setTimeout(() => {
								searchVetsInputRef?.current?.focus();
							}, 0);
						} catch (error) {
							logInDevelopment(error);

							toast({
								title: "Failed to delete relationship",
								description: "Something went wrong while deleting the relationship. Please try again.",
								variant: "destructive",
							});
						}
					}
				}}
			/>

			<FormGroup title="Vets" description="Manage the relationships between this dog and vets.">
				<ManageVetSheet
					withoutTrigger
					open={!!isCreateVetSheetOpen}
					setOpen={(value) => {
						if (value === false) {
							setIsCreateVetSheetOpen(null);

							// HACK: Focus the input after the sheet closes
							setTimeout(() => {
								searchVetsInputRef?.current?.focus();
							}, 0);
						}
					}}
					defaultValues={{
						givenName:
							typeof isCreateVetSheetOpen === "string"
								? isCreateVetSheetOpen.split(" ").length === 1
									? isCreateVetSheetOpen
									: isCreateVetSheetOpen.split(" ").slice(0, -1).join(" ")
								: undefined,
						familyName:
							typeof isCreateVetSheetOpen === "string"
								? isCreateVetSheetOpen?.split(" ").length > 1
									? isCreateVetSheetOpen?.split(" ").pop()
									: undefined
								: undefined,
					}}
					onSuccessfulSubmit={() => {
						searchVetsInputRef?.current?.focus();
					}}
				/>

				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchVetsInputRef}
						placeholder={
							dogToVetRelationships.fields.length === 0
								? "Search vets..."
								: dogToVetRelationships.fields.length === 1
								? "1 vet selected"
								: `${dogToVetRelationships.fields.length} vets selected`
						}
						onSearch={async (searchTerm) => {
							const res = await context.app.vets.search.fetch({ searchTerm });

							return res.data ?? [];
						}}
						resultLabel={(result) => `${result.givenName} ${result.familyName}`}
						selected={dogToVetRelationships.fields.map((dogToVetRelationship) => dogToVetRelationship.vet)}
						onSelect={async (vet) => {
							const selected = dogToVetRelationships.fields.find((relationship) => relationship.vetId === vet.id);

							if (selected) {
								setConfirmRelationshipDelete(selected.id);
								return;
							}

							const relationship = {
								id: generateId(),
								dogId: form.getValues("id"),
								vetId: vet.id,
								vet,
								relationship: "primary",
							} satisfies ManageDogFormSchema["dogToVetRelationships"][number];

							if (!isNew) {
								try {
									await insertDogToVetRelationshipMutation.mutateAsync(relationship);

									toast({
										title: "Created relationship",
										description: `Relationship between vet "${vet.givenName} ${vet.familyName}" and dog ${
											form.getValues("givenName") ? `"${form.getValues("givenName")}"` : ""
										} has been successfully created.`,
									});
								} catch (error) {
									logInDevelopment(error);

									toast({
										title: "Failed to create relationship",
										description: `Relationship between vet "${vet.givenName} ${vet.familyName}" and dog ${
											form.getValues("givenName") ? `"${form.getValues("givenName")}"` : ""
										} failed to create. Please try again.`,
									});
								}
							}

							form.setValue("dogToVetRelationships", [...dogToVetRelationships.fields, relationship], {
								shouldDirty: false,
							});
						}}
						renderActions={({ searchTerm }) => (
							<MultiSelectSearchComboboxAction
								onSelect={() => {
									setIsCreateVetSheetOpen(searchTerm || true);
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
									onDelete={() => {
										setConfirmRelationshipDelete(dogToVetRelationship.id);
									}}
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
	onDelete: () => void;
}) {
	const { toast } = useToast();
	const form = useFormContext<ManageDogFormSchema>();

	const [isFetchingVet, setIsFetchingVet] = React.useState(false);

	const previousRelationship = React.useRef(dogToVetRelationship.relationship);

	const context = api.useContext();

	const updateDogToVetRelationshipMutation = api.app.dogs.dogToVetRelationships.update.useMutation();

	return (
		<li
			key={dogToVetRelationship.id}
			className={cn("flex items-center justify-between gap-x-6", index === 0 ? "pb-4" : "py-4")}
		>
			<div className="flex shrink items-center gap-x-2 truncate">
				<div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
					<UserCircleIcon className="h-5 w-5" />
				</div>

				<div className="min-w-0 flex-auto">
					<p className="px-2 text-sm font-semibold leading-6 text-primary">
						{dogToVetRelationship.vet.givenName} {dogToVetRelationship.vet.familyName}
					</p>
					<div className="flex flex-col gap-y-2 truncate px-2 pt-1 md:flex-row md:items-center md:space-x-2 md:pt-0">
						{dogToVetRelationship.vet.emailAddress && (
							<ClickToCopy text={dogToVetRelationship.vet.emailAddress}>
								<EnvelopeIcon className="mr-1 h-3 w-3" />
								<span className="truncate">{dogToVetRelationship.vet.emailAddress}</span>
							</ClickToCopy>
						)}
						{dogToVetRelationship.vet.emailAddress && dogToVetRelationship.vet.phoneNumber && (
							<span aria-hidden="true" className="hidden md:inline">
								&middot;
							</span>
						)}
						{dogToVetRelationship.vet.phoneNumber && (
							<ClickToCopy text={dogToVetRelationship.vet.phoneNumber}>
								<PhoneIcon className="mr-1 h-3 w-3" />
								<span className="truncate">{dogToVetRelationship.vet.phoneNumber}</span>
							</ClickToCopy>
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
								value={field.value}
								onValueChange={(value) => {
									if (value !== field.value) {
										// Using form.setValue instead of field.onChange because we want to set shouldDirty to false
										form.setValue(`dogToVetRelationships.${index}.relationship`, value as typeof field.value, {
											shouldDirty: false,
										});

										updateDogToVetRelationshipMutation
											.mutateAsync({
												id: dogToVetRelationship.id,
												relationship: value as typeof field.value,
											})
											.then(() => {
												toast({
													title: "Updated relationship",
													description: `The relationship between vet "${dogToVetRelationship.vet.givenName} ${
														dogToVetRelationship.vet.familyName
													}" and dog ${
														form.getValues("givenName") ? `"${form.getValues("givenName")}"` : ""
													} has been successfully updated.`,
												});
											})
											.catch((error) => {
												logInDevelopment(error);

												// HACK: Reset the value to the previous value. Without the setTimeout, the value is not correctly reset
												setTimeout(() => {
													// Using form.setValue instead of field.onChange because we want to set shouldDirty to false
													form.setValue(`dogToVetRelationships.${index}.relationship`, previousRelationship.current, {
														shouldDirty: false,
													});
												});

												toast({
													title: "Failed to update relationship",
													description: `The relationship between vet "${dogToVetRelationship.vet.givenName} ${
														dogToVetRelationship.vet.familyName
													}" and dog ${
														form.getValues("givenName") ? `"${form.getValues("givenName")}"` : ""
													} failed to update. Please try again.`,
													variant: "destructive",
												});
											});
									}
								}}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select relation">
											<span className="truncate capitalize">{field.value?.split("-").join(" ")}</span>
										</SelectValue>
									</SelectTrigger>
								</FormControl>
								<SelectContent align="end">
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
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();

									setIsFetchingVet(true);

									context.app.vets.byId
										.fetch({ id: dogToVetRelationship.vet.id })
										.then((result) => {
											if (!result.data) {
												throw new Error("No vet found");
											}

											onEdit(result.data);
										})
										.catch(() => {
											toast({
												title: "Failed to fetch vet",
												description: "Something went wrong while fetching the vet. Please try again.",
												variant: "destructive",
											});
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
								onSelect={(e) => {
									e.preventDefault();
									onDelete();
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
