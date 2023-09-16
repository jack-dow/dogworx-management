"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

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
import { InsertVetToVetClinicRelationshipSchema } from "~/db/validation/app";
import { api } from "~/lib/trpc/client";
import { cn, generateId, logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";
import { ManageVetSheet } from "../manage-vet/manage-vet-sheet";
import { ClickToCopy } from "../ui/click-to-copy";
import { Loader } from "../ui/loader";
import { MultiSelectSearchCombobox, MultiSelectSearchComboboxAction } from "../ui/multi-select-search-combobox";
import { useToast } from "../ui/use-toast";
import { type ManageVetClinicFormSchema } from "./use-manage-vet-clinic-form";

type VetById = NonNullable<RouterOutputs["app"]["vets"]["byId"]["data"]>;

function VetClinicToVetRelationships({ isNew, variant }: { isNew: boolean; variant: "sheet" | "form" }) {
	const { toast } = useToast();
	const form = useFormContext<ManageVetClinicFormSchema>();

	const vetToVetClinicRelationships = useFieldArray({
		control: form.control,
		name: "vetToVetClinicRelationships",
		keyName: "rhf-id",
	});

	const [editingVet, setEditingVet] = React.useState<VetById | null>(null);
	const [isCreateVetSheetOpen, setIsCreateVetSheetOpen] = React.useState<true | string | null>(null);

	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);

	const searchVetsInputRef = React.useRef<HTMLInputElement>(null);

	const context = api.useContext();

	const insertVetToVetClinicRelationshipMutation = api.app.vetClinics.vetToVetClinicRelationships.insert.useMutation();
	const deleteVetToVetClinicRelationshipMutation = api.app.vetClinics.vetToVetClinicRelationships.delete.useMutation();

	const FieldsWrapper = variant === "sheet" ? FormSheetGroup : FormGroup;

	return (
		<>
			<ManageVetSheet
				vet={editingVet ?? undefined}
				open={!!editingVet}
				setOpen={(value) => {
					if (value === false) {
						setEditingVet(null);
					}
				}}
				withoutTrigger
				onSuccessfulSubmit={(vet) => {
					const newVetToVetClinicRelationships = [...vetToVetClinicRelationships.fields].map((field) => {
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

					form.setValue("vetToVetClinicRelationships", newVetToVetClinicRelationships, { shouldDirty: false });
				}}
				onDelete={(id) => {
					form.setValue(
						"vetToVetClinicRelationships",
						vetToVetClinicRelationships.fields.filter((relationship) => relationship.vetId !== id),
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
								await deleteVetToVetClinicRelationshipMutation.mutateAsync({
									id: confirmRelationshipDelete,
								});
							}

							// Use setValue instead of remove so that we can set shouldDirty to false
							form.setValue(
								"vetToVetClinicRelationships",
								vetToVetClinicRelationships.fields.filter(
									(relationship) => relationship.id !== confirmRelationshipDelete,
								),
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

			<FieldsWrapper title="Vets" description="Manage the relationships between this vet clinic and their vets.">
				<ManageVetSheet
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
								? isCreateVetSheetOpen.split(" ").length > 1
									? isCreateVetSheetOpen.split(" ").pop()
									: undefined
								: undefined,
					}}
					onSuccessfulSubmit={() => {
						searchVetsInputRef?.current?.focus();
					}}
					withoutTrigger
				/>

				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchVetsInputRef}
						placeholder={
							vetToVetClinicRelationships.fields.length === 0
								? "Search vets..."
								: vetToVetClinicRelationships.fields.length === 1
								? "1 vet selected"
								: `${vetToVetClinicRelationships.fields.length} vets selected`
						}
						onSearch={async (searchTerm) => {
							const res = await context.app.vets.search.fetch({ searchTerm });

							return res.data ?? [];
						}}
						resultLabel={(result) => `${result.givenName} ${result.familyName}`}
						selected={vetToVetClinicRelationships.fields.map(
							(vetToVetClinicRelationship) => vetToVetClinicRelationship.vet,
						)}
						onSelect={async (vet) => {
							const relationship = {
								id: generateId(),
								vetClinicId: form.getValues("id"),
								vetId: vet.id,
								vet,
								relationship: "full-time",
							} satisfies ManageVetClinicFormSchema["vetToVetClinicRelationships"][number];

							if (!isNew) {
								try {
									await insertVetToVetClinicRelationshipMutation.mutateAsync(relationship);

									toast({
										title: "Created relationship",
										description: `Relationship between vet ${
											vet.givenName ? `"${vet.givenName}${vet.familyName ? " " + vet.familyName : ""}"` : ""
										} and vet clinic ${
											form.getValues("name") ? `"${form.getValues("name")}"` : ""
										} has been successfully created.`,
									});
								} catch (error) {
									logInDevelopment(error);

									toast({
										title: "Failed to create relationship",
										description: `Relationship between vet ${
											vet.givenName ? `"${vet.givenName}${vet.familyName ? " " + vet.familyName : ""}"` : ""
										} and vet clinic ${
											form.getValues("name") ? `"${form.getValues("name")}"` : ""
										} failed to create. Please try again.`,
									});
								}
							}

							vetToVetClinicRelationships.append(relationship);
						}}
						renderActions={({ searchTerm }) => (
							<MultiSelectSearchComboboxAction
								onSelect={() => {
									setIsCreateVetSheetOpen(searchTerm || true);
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
									onDelete={() => {
										setConfirmRelationshipDelete(vetToVetClinicRelationship.id);
									}}
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
	vetToVetClinicRelationship: ManageVetClinicFormSchema["vetToVetClinicRelationships"][number];
	index: number;
	onEdit: (vet: VetById) => void;
	onDelete: () => void;
	variant: "sheet" | "form";
}) {
	const { toast } = useToast();
	const form = useFormContext<ManageVetClinicFormSchema>();

	const [isFetchingVet, setIsFetchingVet] = React.useState(false);
	const [updatingRelationshipTo, setUpdatingRelationshipTo] = React.useState<
		keyof typeof InsertVetToVetClinicRelationshipSchema.shape.relationship.Enum | null
	>(null);

	const context = api.useContext();

	const updateVetToVetClinicRelationshipMutation = api.app.vetClinics.vetToVetClinicRelationships.update.useMutation();

	return (
		<li
			key={vetToVetClinicRelationship.id}
			className={cn("flex items-center justify-between gap-x-6", index === 0 ? "pb-4" : "py-4")}
		>
			<div className="flex shrink items-center gap-x-2 truncate">
				<div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
					<UserCircleIcon className="h-5 w-5" />
				</div>

				<div className="min-w-0 flex-auto ">
					<p className="px-2 text-sm font-semibold leading-6 text-primary">
						{vetToVetClinicRelationship.vet.givenName} {vetToVetClinicRelationship.vet.familyName}
					</p>
					<div
						className={cn(
							"flex flex-col gap-y-2 truncate px-2 pt-1",
							variant === "sheet"
								? " xl:flex-row xl:items-center xl:space-x-2 xl:pt-0"
								: " md:flex-row md:items-center md:space-x-2 md:pt-0",
						)}
					>
						{vetToVetClinicRelationship.vet.emailAddress && (
							<ClickToCopy text={vetToVetClinicRelationship.vet.emailAddress}>
								<EnvelopeIcon className="mr-1 h-3 w-3" />
								<span className="truncate">{vetToVetClinicRelationship.vet.emailAddress}</span>
							</ClickToCopy>
						)}
						{vetToVetClinicRelationship.vet.emailAddress && vetToVetClinicRelationship.vet.phoneNumber && (
							<span aria-hidden="true" className={cn("hidden", variant === "sheet" ? "xl:inline" : "md:inline")}>
								&middot;
							</span>
						)}
						{vetToVetClinicRelationship.vet.phoneNumber && (
							<ClickToCopy text={vetToVetClinicRelationship.vet.phoneNumber}>
								<PhoneIcon className="mr-1 h-3 w-3" />
								<span className="truncate">{vetToVetClinicRelationship.vet.phoneNumber}</span>
							</ClickToCopy>
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
								value={field.value}
								onValueChange={(value) => {
									if (value !== field.value) {
										setUpdatingRelationshipTo(value as typeof field.value);

										updateVetToVetClinicRelationshipMutation
											.mutateAsync({
												id: vetToVetClinicRelationship.id,
												relationship: value as typeof field.value,
											})
											.then(() => {
												field.onChange(value as typeof field.value);

												toast({
													title: "Updated relationship",
													description: `The relationship between vet ${
														vetToVetClinicRelationship.vet.givenName
															? `"${vetToVetClinicRelationship.vet.givenName}${
																	vetToVetClinicRelationship.vet.familyName
																		? " " + vetToVetClinicRelationship.vet.familyName
																		: ""
															  }"`
															: ""
													} and vet clinic ${
														form.getValues("name") ? `"${form.getValues("name")}"` : ""
													} has been successfully updated.`,
												});
											})
											.catch((error) => {
												logInDevelopment(error);

												toast({
													title: "Failed to update relationship",
													description: `The relationship between vet ${
														vetToVetClinicRelationship.vet.givenName
															? `"${vetToVetClinicRelationship.vet.givenName}${
																	vetToVetClinicRelationship.vet.familyName
																		? " " + vetToVetClinicRelationship.vet.familyName
																		: ""
															  }"`
															: ""
													} and vet clinic ${
														form.getValues("name") ? `"${form.getValues("name")}"` : ""
													} failed to update. Please try again.`,
													variant: "destructive",
												});
											})
											.finally(() => {
												setUpdatingRelationshipTo(null);
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
								<SelectContent withoutPortal={variant === "sheet"} align="end">
									<SelectGroup>
										<SelectLabel>Relationships</SelectLabel>
										{Object.values(InsertVetToVetClinicRelationshipSchema.shape.relationship.Values).map((relation) => (
											<SelectItem
												key={relation}
												value={relation}
												className="capitalize"
												isLoading={updatingRelationshipTo === relation}
											>
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
						<DropdownMenuContent withoutPortal={variant === "sheet"} align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();

									setIsFetchingVet(true);

									context.app.vets.byId
										.fetch({ id: vetToVetClinicRelationship.vet.id })
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
								<span className="flex-1">Edit</span>
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

export { VetClinicToVetRelationships };
