"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

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
import { actions, type ClientById, type DogsSearch } from "~/actions";
import { InsertDogToClientRelationshipSchema } from "~/db/validation";
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
import { type ManageClientFormSchema } from "./manage-client";

function ClientToDogRelationships({
	control,
	existingDogToClientRelationships,
	variant,
	setOpen,
}: {
	control: Control<ManageClientFormSchema>;
	existingDogToClientRelationships: ClientById["dogToClientRelationships"] | undefined;
	variant: "sheet" | "form";
	setOpen?: (open: boolean) => void;
}) {
	const router = useRouter();
	const form = useFormContext<ManageClientFormSchema>();

	const dogToClientRelationships = useFieldArray({
		control,
		name: "dogToClientRelationships",
		keyName: "rhf-id",
	});

	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);

	const searchDogsInputRef = React.useRef<HTMLInputElement>(null);

	function handleDogToClientRelationshipDelete(relationshipId: string) {
		const dogToClientRelationshipActions = { ...form.getValues("actions.dogToClientRelationships") };

		dogToClientRelationships.remove(dogToClientRelationships.fields.findIndex((field) => field.id === relationshipId));

		if (dogToClientRelationshipActions[relationshipId]?.type === "INSERT") {
			delete dogToClientRelationshipActions[relationshipId];
		} else {
			dogToClientRelationshipActions[relationshipId] = {
				type: "DELETE",
				payload: relationshipId,
			};
		}

		form.setValue("actions.dogToClientRelationships", dogToClientRelationshipActions);

		// HACK: Focus the button after the dialog closes
		setTimeout(() => {
			searchDogsInputRef?.current?.focus();
		}, 0);
	}

	function toggleDogToClientRelationship(dog: DogsSearch[number]) {
		const relationshipId = dogToClientRelationships.fields.find(
			(dogToClientRelationship) => dogToClientRelationship.dogId === dog.id,
		)?.id;

		if (relationshipId) {
			const existingDogToClientRelationship = existingDogToClientRelationships?.find(
				(dogToClientRelationship) => dogToClientRelationship.id === relationshipId,
			);
			if (existingDogToClientRelationship) {
				setConfirmRelationshipDelete(existingDogToClientRelationship.id);
			} else {
				handleDogToClientRelationshipDelete(relationshipId);
			}

			return;
		}
		const id = generateId();

		dogToClientRelationships.append({
			id,
			clientId: form.getValues("id"),
			dogId: dog.id,
			relationship: "owner",
			dog,
		});

		form.setValue("actions.dogToClientRelationships", {
			...form.getValues("actions.dogToClientRelationships"),
			[id]: {
				type: "INSERT",
				payload: {
					id,
					clientId: form.getValues("id"),
					dogId: dog.id,
					relationship: "owner",
				},
			},
		});
	}

	const FieldsWrapper = variant === "sheet" ? FormSheetGroup : FormGroup;

	return (
		<>
			<DestructiveActionDialog
				name="relationship"
				requiresSaveOf="client"
				withoutTrigger
				open={!!confirmRelationshipDelete}
				onOpenChange={() => setConfirmRelationshipDelete(null)}
				onConfirm={() => {
					if (confirmRelationshipDelete) {
						handleDogToClientRelationshipDelete(confirmRelationshipDelete);
						// HACK: Focus the combobox trigger after the dialog closes
						setTimeout(() => {
							searchDogsInputRef?.current?.focus();
						}, 0);
					}
				}}
			/>

			<FieldsWrapper title="Dogs" description="Manage the relationships between this client and their dogs.">
				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchDogsInputRef}
						resultLabel={(result) => `${result.givenName} ${result.familyName}`}
						selected={dogToClientRelationships.fields.map((dogToClientRelationship) => dogToClientRelationship.dog)}
						onSelect={(dog) => {
							toggleDogToClientRelationship(dog);
						}}
						onSearch={async (searchTerm) => {
							const res = await actions.app.dogs.search(searchTerm);

							return res.data ?? [];
						}}
						placeholder={
							dogToClientRelationships.fields.length === 0
								? "Search dogs..."
								: dogToClientRelationships.fields.length === 1
								? "1 dog selected"
								: `${dogToClientRelationships.fields.length} dogs selected`
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
						{dogToClientRelationships.fields.map((dogToClientRelationship, index) => (
							<ClientToDogRelationship
								key={dogToClientRelationship.id}
								dogToClientRelationship={dogToClientRelationship}
								index={index}
								onDelete={() => toggleDogToClientRelationship(dogToClientRelationship.dog)}
							/>
						))}
					</ul>
				</div>
			</FieldsWrapper>
		</>
	);
}

function ClientToDogRelationship({
	dogToClientRelationship,
	index,
	onDelete,
}: {
	dogToClientRelationship: ManageClientFormSchema["dogToClientRelationships"][number];
	index: number;
	onDelete: () => void;
}) {
	const form = useFormContext<ManageClientFormSchema>();
	const router = useRouter();

	const [isLoadingDogPage, setIsLoadingDogPage] = React.useState(false);
	return (
		<li
			key={dogToClientRelationship.id}
			className={cn("flex items-center justify-between gap-x-6", index === 0 ? "pb-4" : "py-4")}
		>
			<div className="flex shrink items-center gap-x-2 truncate">
				<div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50">
					<DogIcon className="h-5 w-5" />
				</div>
				<div className="min-w-0 flex-auto">
					<p className="truncate text-sm font-semibold capitalize leading-6 text-slate-900">
						{dogToClientRelationship.dog.givenName} {dogToClientRelationship.dog.familyName}
					</p>
					<p className="truncate text-xs capitalize leading-5 text-slate-500">{dogToClientRelationship.dog.color}</p>
				</div>
			</div>
			<div className="flex space-x-4">
				<FormField
					control={form.control}
					name={`dogToClientRelationships.${index}.relationship`}
					rules={{ required: "Please select a relationship" }}
					defaultValue={dogToClientRelationship.relationship}
					render={({ field }) => (
						<FormItem>
							<Select
								onValueChange={(value) => {
									field.onChange(value as typeof field.value);

									const existingAction = form.getValues(
										`actions.dogToClientRelationships.${dogToClientRelationship.id}`,
									);

									if (existingAction?.type === "INSERT") {
										form.setValue(`actions.dogToClientRelationships.${dogToClientRelationship.id}`, {
											type: "INSERT",
											payload: {
												...existingAction.payload,
												relationship: value as typeof field.value,
											},
										});
										return;
									}

									form.setValue(`actions.dogToClientRelationships.${dogToClientRelationship.id}`, {
										type: "UPDATE",
										payload: {
											...dogToClientRelationship,
											relationship: value as typeof field.value,
										},
									});
								}}
								value={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select relation">
											<span className="whitespace-nowrap capitalize">{field.value?.split("-").join(" ")}</span>
										</SelectValue>
									</SelectTrigger>
								</FormControl>
								<SelectContent withoutPortal>
									<SelectGroup>
										<SelectLabel>Relationships</SelectLabel>
										{Object.values(InsertDogToClientRelationshipSchema.shape.relationship.Values).map((relation) => (
											<SelectItem key={relation} value={relation} className=" capitalize">
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
						<DropdownMenuContent withoutPortal align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />

							<DropdownMenuItem asChild>
								<Link
									href={`/dog/${dogToClientRelationship.dogId}`}
									onClick={(e) => {
										e.preventDefault();
										router.push(`/dog/${dogToClientRelationship.dogId}`);
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

export { ClientToDogRelationships };
