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
import { api, type RouterOutputs } from "~/lib/trpc/client";
import { cn, generateId, logInDevelopment } from "~/lib/utils";
import { ManageVetClinicSheet } from "../manage-vet-clinic/manage-vet-clinic-sheet";
import { ClickToCopy } from "../ui/click-to-copy";
import { Loader } from "../ui/loader";
import { MultiSelectSearchCombobox, MultiSelectSearchComboboxAction } from "../ui/multi-select-search-combobox";
import { useToast } from "../ui/use-toast";
import { type ManageVetFormSchema } from "./use-manage-vet-form";

type VetClinicById = NonNullable<RouterOutputs["app"]["vetClinics"]["byId"]["data"]>;

function VetToVetClinicRelationships({ isNew, variant }: { isNew: boolean; variant: "sheet" | "form" }) {
	const { toast } = useToast();
	const form = useFormContext<ManageVetFormSchema>();

	const vetToVetClinicRelationships = useFieldArray({
		control: form.control,
		name: "vetToVetClinicRelationships",
		keyName: "rhf-id",
	});

	const [editingVetClinic, setEditingVetClinic] = React.useState<VetClinicById | null>(null);
	const [isCreateVetClinicSheetOpen, setIsCreateVetClinicSheetOpen] = React.useState<true | string | null>(null);

	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);

	const searchVetClinicsInputRef = React.useRef<HTMLInputElement>(null);

	const context = api.useContext();

	const insertVetToVetClinicRelationshipMutation = api.app.vets.vetToVetClinicRelationships.insert.useMutation();
	const deleteVetToVetClinicRelationshipMutation = api.app.vets.vetToVetClinicRelationships.delete.useMutation();

	const FieldsWrapper = variant === "sheet" ? FormSheetGroup : FormGroup;

	return (
		<>
			<ManageVetClinicSheet
				withoutTrigger
				open={!!editingVetClinic}
				setOpen={(value) => {
					if (value === false) {
						setEditingVetClinic(null);
					}
				}}
				vetClinic={editingVetClinic ?? undefined}
				onSuccessfulSubmit={(vetClinic) => {
					const newVetToVetClinicRelationships = [...vetToVetClinicRelationships.fields].map((field) => {
						if (field.vetId === vetClinic.id) {
							return {
								...field,
								vetClinic: {
									...field.vetClinic,
									...vetClinic,
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
								searchVetClinicsInputRef?.current?.focus();
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

			<FieldsWrapper title="Vet Clinics" description="Manage the relationships between this vet and their vet clinics.">
				<ManageVetClinicSheet
					open={!!isCreateVetClinicSheetOpen}
					setOpen={(value) => {
						if (value === false) {
							setIsCreateVetClinicSheetOpen(null);

							// HACK: Focus the input after the sheet closes
							setTimeout(() => {
								searchVetClinicsInputRef?.current?.focus();
							}, 0);
						}
					}}
					defaultValues={{
						name: typeof isCreateVetClinicSheetOpen === "string" ? isCreateVetClinicSheetOpen : undefined,
					}}
					onSuccessfulSubmit={() => {
						searchVetClinicsInputRef?.current?.focus();
					}}
					withoutTrigger
				/>

				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchVetClinicsInputRef}
						placeholder={
							vetToVetClinicRelationships.fields.length === 0
								? "Search vets clinics..."
								: vetToVetClinicRelationships.fields.length === 1
								? "1 vet clinic selected"
								: `${vetToVetClinicRelationships.fields.length} vets clinics selected`
						}
						onSearch={async (searchTerm) => {
							const res = await context.app.vetClinics.search.fetch({ searchTerm });

							return res.data ?? [];
						}}
						resultLabel={(result) => result.name}
						selected={vetToVetClinicRelationships.fields.map(
							(vetToVetClinicRelationship) => vetToVetClinicRelationship.vetClinic,
						)}
						onSelect={async (vetClinic) => {
							const selected = vetToVetClinicRelationships.fields.find(
								(relationship) => relationship.vetClinicId === vetClinic.id,
							);

							if (selected) {
								setConfirmRelationshipDelete(selected.id);
								return;
							}

							const relationship = {
								id: generateId(),
								vetId: form.getValues("id"),
								vetClinicId: vetClinic.id,
								vetClinic,
								relationship: "full-time",
							} satisfies ManageVetFormSchema["vetToVetClinicRelationships"][number];

							if (!isNew) {
								try {
									await insertVetToVetClinicRelationshipMutation.mutateAsync(relationship);

									toast({
										title: "Created relationship",
										description: `Relationship between vet clinic "${vetClinic.name}" and vet ${
											form.getValues("givenName")
												? `"${form.getValues("givenName")}${
														form.getValues("familyName") ? " " + form.getValues("familyName") : ""
												  }"`
												: ""
										} has been successfully created.`,
									});
								} catch (error) {
									logInDevelopment(error);

									toast({
										title: "Failed to create relationship",
										description: `Relationship between vet clinic "${vetClinic.name}" and vet ${
											form.getValues("givenName")
												? `"${form.getValues("givenName")}${
														form.getValues("familyName") ? " " + form.getValues("familyName") : ""
												  }"`
												: ""
										} failed to create. Please try again.`,
									});
								}
							}

							form.setValue("vetToVetClinicRelationships", [...vetToVetClinicRelationships.fields, relationship], {
								shouldDirty: false,
							});
						}}
						renderActions={({ searchTerm }) => (
							<MultiSelectSearchComboboxAction
								onSelect={() => {
									setIsCreateVetClinicSheetOpen(searchTerm || true);
								}}
							>
								<UserPlusIcon className="mr-2 h-4 w-4" />
								<span className="truncate">Create new vet clinic {searchTerm && `"${searchTerm}"`}</span>
							</MultiSelectSearchComboboxAction>
						)}
					/>
				</div>

				{vetToVetClinicRelationships.fields.length > 0 && (
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

function VetToVetClinicRelationship({
	vetToVetClinicRelationship,
	index,
	onEdit,
	onDelete,
	variant,
}: {
	vetToVetClinicRelationship: ManageVetFormSchema["vetToVetClinicRelationships"][number];
	index: number;
	onEdit: (vetClinic: VetClinicById) => void;
	onDelete: () => void;
	variant: "sheet" | "form";
}) {
	const { toast } = useToast();
	const form = useFormContext<ManageVetFormSchema>();

	const [isFetchingVetClinic, setIsFetchingVetClinic] = React.useState(false);

	const previousRelationship = React.useRef(vetToVetClinicRelationship.relationship);

	const context = api.useContext();

	const updateVetToVetClinicRelationshipMutation = api.app.vets.vetToVetClinicRelationships.update.useMutation();

	return (
		<li className={cn("flex items-center justify-between gap-x-6", index === 0 ? "pb-4" : "py-4")}>
			<div className="flex shrink items-center gap-x-2 truncate">
				<div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
					<UserCircleIcon className="h-5 w-5" />
				</div>

				<div className="min-w-0 flex-auto">
					<p className="px-2 text-sm font-semibold leading-6 text-primary">
						{vetToVetClinicRelationship.vetClinic.name}
					</p>
					<div
						className={cn(
							"flex flex-col gap-y-2 truncate px-2 pt-1",
							variant === "sheet"
								? " xl:flex-row xl:items-center xl:space-x-2 xl:pt-0"
								: " md:flex-row md:items-center md:space-x-2 md:pt-0",
						)}
					>
						{vetToVetClinicRelationship.vetClinic.emailAddress && (
							<ClickToCopy text={vetToVetClinicRelationship.vetClinic.emailAddress}>
								<EnvelopeIcon className="mr-1 h-3 w-3" />
								<span className="truncate">{vetToVetClinicRelationship.vetClinic.emailAddress}</span>
							</ClickToCopy>
						)}
						{vetToVetClinicRelationship.vetClinic.emailAddress && vetToVetClinicRelationship.vetClinic.phoneNumber && (
							<span aria-hidden="true" className={cn("hidden", variant === "sheet" ? "xl:inline" : "md:inline")}>
								&middot;
							</span>
						)}
						{vetToVetClinicRelationship.vetClinic.phoneNumber && (
							<ClickToCopy text={vetToVetClinicRelationship.vetClinic.phoneNumber}>
								<PhoneIcon className="mr-1 h-3 w-3" />
								<span className="truncate">{vetToVetClinicRelationship.vetClinic.phoneNumber}</span>
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
										// Using form.setValue instead of field.onChange because we want to set shouldDirty to false
										form.setValue(`vetToVetClinicRelationships.${index}.relationship`, value as typeof field.value, {
											shouldDirty: false,
										});

										updateVetToVetClinicRelationshipMutation
											.mutateAsync({
												id: vetToVetClinicRelationship.id,
												relationship: value as typeof field.value,
											})
											.then(() => {
												toast({
													title: "Updated relationship",
													description: `The relationship between vet clinic "${
														vetToVetClinicRelationship.vetClinic.name
													}" and vet ${
														form.getValues("givenName")
															? `"${form.getValues("givenName")}${
																	form.getValues("familyName") ? " " + form.getValues("familyName") : ""
															  }"`
															: ""
													} has been successfully updated.`,
												});
											})
											.catch((error) => {
												logInDevelopment(error);

												// HACK: Reset the value to the previous value. Without the setTimeout, the value is not correctly reset
												setTimeout(() => {
													// Using form.setValue instead of field.onChange because we want to set shouldDirty to false
													form.setValue(
														`vetToVetClinicRelationships.${index}.relationship`,
														previousRelationship.current,
														{
															shouldDirty: false,
														},
													);
												});

												toast({
													title: "Failed to update relationship",
													description: `The relationship between vet clinic "${
														vetToVetClinicRelationship.vetClinic.name
													}" and vet ${
														form.getValues("givenName")
															? `"${form.getValues("givenName")}${
																	form.getValues("familyName") ? " " + form.getValues("familyName") : ""
															  }"`
															: ""
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
								<SelectContent withoutPortal={variant === "sheet"} align="end">
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
						<DropdownMenuContent withoutPortal={variant === "sheet"} align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();

									setIsFetchingVetClinic(true);

									context.app.vetClinics.byId
										.fetch({ id: vetToVetClinicRelationship.vetClinic.id })
										.then((result) => {
											if (!result.data) {
												throw new Error("No vet clinic found");
											}

											onEdit(result.data);
										})
										.catch(() => {
											toast({
												title: "Failed to fetch vet clinic",
												description: "Something went wrong while fetching the vet clinic. Please try again.",
												variant: "destructive",
											});
										})
										.finally(() => {
											setIsFetchingVetClinic(false);
										});
								}}
							>
								<EditIcon className="mr-2 h-4 w-4" />
								<span className="flex-1">Edit</span>
								{isFetchingVetClinic && <Loader size="sm" variant="black" className="ml-2 mr-0" />}
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

export { VetToVetClinicRelationships };
