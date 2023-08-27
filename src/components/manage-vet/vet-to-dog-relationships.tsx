"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useFormContext } from "react-hook-form";

import { DogIcon, EditIcon, EllipsisVerticalIcon, PlusIcon, TrashIcon } from "~/components/ui/icons";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { actions, type DogsSearch, type VetById } from "~/actions";
import { InsertDogToVetRelationshipSchema } from "~/db/validation";
import { cn, generateId } from "~/utils";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FormControl, FormField, FormGroup, FormItem, FormMessage, FormSheetGroup } from "../ui/form";
import { Loader } from "../ui/loader";
import { MultiSelectSearchCombobox, MultiSelectSearchComboboxAction } from "../ui/multi-select-search-combobox";
import { type ManageVetFormSchema } from "./use-manage-vet-form";

function VetToDogRelationships({
	existingDogToVetRelationships,
	variant,
	setOpen,
}: {
	existingDogToVetRelationships: VetById["dogToVetRelationships"] | undefined;
	variant: "sheet" | "form";
	setOpen?: (open: boolean) => void;
}) {
	const form = useFormContext<ManageVetFormSchema>();
	const router = useRouter();

	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);

	const dogToVetRelationships = useFieldArray({
		control: form.control,
		name: "dogToVetRelationships",
		keyName: "rhf-id",
	});

	const searchDogsInputRef = React.useRef<HTMLInputElement>(null);

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

		// HACK: Focus the button after the dialog closes
		setTimeout(() => {
			searchDogsInputRef?.current?.focus();
		}, 0);
	}

	function toggleDogToVetRelationship(dog: DogsSearch[number]) {
		const relationshipId = dogToVetRelationships.fields.find(
			(dogToVetRelationship) => dogToVetRelationship.dogId === dog.id,
		)?.id;

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
			vetId: form.getValues("id"),
			dogId: dog.id,
			relationship: "primary",
			dog,
		});

		form.setValue("actions.dogToVetRelationships", {
			...form.getValues("actions.dogToVetRelationships"),
			[id]: {
				type: "INSERT",
				payload: {
					id,
					vetId: form.getValues("id"),
					dogId: dog.id,
					relationship: "primary",
				},
			},
		});
	}

	const FieldsWrapper = variant === "sheet" ? FormSheetGroup : FormGroup;

	return (
		<>
			<DestructiveActionDialog
				name="relationship"
				requiresSaveOf="vet"
				withoutTrigger
				open={!!confirmRelationshipDelete}
				onOpenChange={() => setConfirmRelationshipDelete(null)}
				onConfirm={() => {
					if (confirmRelationshipDelete) {
						handleDogToVetRelationshipDelete(confirmRelationshipDelete);
						// HACK: Focus the combobox trigger after the dialog closes
						setTimeout(() => {
							searchDogsInputRef?.current?.focus();
						}, 0);
					}
				}}
			/>

			<FieldsWrapper title="Dogs" description="Manage the relationships between this vet and the dogs they treat.">
				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchDogsInputRef}
						resultLabel={(result) => `${result.givenName} ${result.familyName}`}
						selected={dogToVetRelationships.fields.map((dogToVetRelationship) => dogToVetRelationship.dog)}
						onSelect={(dog) => {
							toggleDogToVetRelationship(dog);
						}}
						onSearch={async (searchTerm) => {
							const res = await actions.app.dogs.search(searchTerm);

							return res.data ?? [];
						}}
						placeholder={
							dogToVetRelationships.fields.length === 0
								? "Search dogs..."
								: dogToVetRelationships.fields.length === 1
								? "1 dog selected"
								: `${dogToVetRelationships.fields.length} dogs selected`
						}
						renderActions={({ searchTerm }) => (
							<MultiSelectSearchComboboxAction
								onSelect={() => {
									router.push(`/dog/new${searchTerm ? `?searchTerm=${searchTerm}` : ""}`);
									if (setOpen) {
										setOpen(false);
									}
								}}
							>
								<PlusIcon className="mr-1 h-4 w-4" />
								<span className="truncate">Create new dog {searchTerm && `"${searchTerm}"`}</span>
							</MultiSelectSearchComboboxAction>
						)}
					/>
				</div>

				<div className="sm:col-span-6">
					<ul role="list" className="divide-y divide-slate-100">
						{dogToVetRelationships.fields.map((dogToVetRelationship, index) => (
							<VetToDogRelationship
								key={dogToVetRelationship.id}
								dogToVetRelationship={dogToVetRelationship}
								index={index}
								onDelete={() => toggleDogToVetRelationship(dogToVetRelationship.dog)}
							/>
						))}
					</ul>
				</div>
			</FieldsWrapper>
		</>
	);
}

function VetToDogRelationship({
	dogToVetRelationship,
	index,
	onDelete,
}: {
	dogToVetRelationship: ManageVetFormSchema["dogToVetRelationships"][number];
	index: number;
	onDelete: () => void;
}) {
	const form = useFormContext<ManageVetFormSchema>();
	const router = useRouter();

	const [isLoadingDogPage, setIsLoadingDogPage] = React.useState(false);
	return (
		<li
			key={dogToVetRelationship.id}
			className={cn("flex items-center justify-between gap-x-6", index === 0 ? "pb-4" : "py-4")}
		>
			<div className="flex shrink items-center gap-x-2 truncate">
				<div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50">
					<DogIcon className="h-5 w-5" />
				</div>

				<div className="min-w-0 flex-auto">
					<p className="truncate text-sm font-semibold capitalize leading-6 text-slate-900">
						{dogToVetRelationship.dog.givenName} {dogToVetRelationship.dog.familyName}
					</p>
					<p className="truncate text-xs capitalize leading-5 text-slate-500">
						{dogToVetRelationship.dog.color} {dogToVetRelationship.dog.breed}
					</p>
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
										<SelectValue placeholder="Select relation">
											<span className="whitespace-nowrap capitalize">{field.value?.split("-").join(" ")} Vet</span>
										</SelectValue>
									</SelectTrigger>
								</FormControl>
								<SelectContent withoutPortal>
									<SelectGroup>
										<SelectLabel>Relationships</SelectLabel>
										{Object.values(InsertDogToVetRelationshipSchema.shape.relationship.Values).map((relation) => (
											<SelectItem key={relation} value={relation} className="capitalize">
												{relation.split("-").join(" ")} Vet
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
						<DropdownMenuContent withoutPortal align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />

							<DropdownMenuItem asChild>
								<Link
									href={`/dog/${dogToVetRelationship.dogId}`}
									onClick={(e) => {
										e.preventDefault();
										router.push(`/dog/${dogToVetRelationship.dogId}`);
										setIsLoadingDogPage(true);
									}}
									className="hover:cursor-pointer"
								>
									<EditIcon className="mr-2 h-4 w-4" />
									<span className="flex-1">Edit</span>
									{isLoadingDogPage && <Loader size="sm" variant="black" className="ml-2 mr-0" />}
								</Link>
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

export { VetToDogRelationships };
