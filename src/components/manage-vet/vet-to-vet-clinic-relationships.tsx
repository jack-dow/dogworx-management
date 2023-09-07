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
import { actions, type VetById, type VetClinicById, type VetClinicsSearch } from "~/actions";
import { InsertVetToVetClinicRelationshipSchema } from "~/db/validation";
import { cn, generateId } from "~/utils";
import { ManageVetClinicSheet } from "../manage-vet-clinic/manage-vet-clinic-sheet";
import { ClickToCopy } from "../ui/click-to-copy";
import { Loader } from "../ui/loader";
import { MultiSelectSearchCombobox, MultiSelectSearchComboboxAction } from "../ui/multi-select-search-combobox";
import { useToast } from "../ui/use-toast";
import { type ManageVetFormSchema } from "./use-manage-vet-form";

function VetToVetClinicRelationships({
	existingVetToVetClinicRelationships,
	variant,
}: {
	existingVetToVetClinicRelationships: VetById["vetToVetClinicRelationships"] | undefined;
	variant: "sheet" | "form";
}) {
	const form = useFormContext<ManageVetFormSchema>();

	const vetToVetClinicRelationships = useFieldArray({
		control: form.control,
		name: "vetToVetClinicRelationships",
		keyName: "rhf-id",
	});

	const [editingVetClinic, setEditingVetClinic] = React.useState<VetClinicById | null>(null);
	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);
	const [isCreateVetClinicSheetOpen, setIsCreateVetClinicSheetOpen] = React.useState<true | string | null>(null);

	const searchVetClinicsInputRef = React.useRef<HTMLInputElement>(null);

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
			searchVetClinicsInputRef?.current?.focus();
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
			<ManageVetClinicSheet
				vetClinic={editingVetClinic ?? undefined}
				open={!!editingVetClinic}
				setOpen={(value) => {
					if (value === false) {
						setEditingVetClinic(null);
					}
				}}
				withoutTrigger
				onSuccessfulSubmit={(vetClinic) => {
					const newVetToVetClinicRelationships = [...vetToVetClinicRelationships.fields].map((field) => {
						if (field.vetClinicId === vetClinic.id) {
							return {
								...field,
								vetClinic,
							};
						}

						return field;
					});

					form.setValue("vetToVetClinicRelationships", newVetToVetClinicRelationships, { shouldDirty: false });
				}}
				onVetClinicDelete={(id) => {
					form.setValue(
						"vetToVetClinicRelationships",
						vetToVetClinicRelationships.fields.filter((relationship) => relationship.vetClinicId !== id),
						{ shouldDirty: false },
					);
				}}
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
						// HACK: Focus the combobox trigger after the dialog closes
						setTimeout(() => {
							searchVetClinicsInputRef?.current?.focus();
						}, 0);
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
					onSuccessfulSubmit={(vetClinic) => {
						toggleVetToVetClinicRelationship(vetClinic);
						searchVetClinicsInputRef?.current?.focus();
					}}
					withoutTrigger
				/>

				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchVetClinicsInputRef}
						resultLabel={(result) => result.name}
						selected={vetToVetClinicRelationships.fields.map(
							(vetToVetClinicRelationship) => vetToVetClinicRelationship.vetClinic,
						)}
						onSelect={(vet) => {
							toggleVetToVetClinicRelationship(vet);
						}}
						onSearch={async (searchTerm) => {
							const res = await actions.app.vetClinics.search(searchTerm);

							return res.data ?? [];
						}}
						placeholder={
							vetToVetClinicRelationships.fields.length === 0
								? "Search vet clinics..."
								: vetToVetClinicRelationships.fields.length === 1
								? "1 vet clinic selected"
								: `${vetToVetClinicRelationships.fields.length} vet clinics selected`
						}
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
	onDelete: (vetClinic: VetClinicsSearch[number]) => void;
	variant: "sheet" | "form";
}) {
	const { toast } = useToast();
	const form = useFormContext<ManageVetFormSchema>();

	const [isFetchingVetClinic, setIsFetchingVetClinic] = React.useState(false);
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

									const renderErrorToast = () => {
										toast({
											title: "Failed to fetch vet clinic",
											description: "Something went wrong while fetching the vet clinic. Please try again.",
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
								<span className="flex-1">Edit</span>
								{isFetchingVetClinic && <Loader size="sm" variant="black" className="ml-2 mr-0" />}
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();
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
