"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { InsertDogToClientRelationshipSchema } from "~/db/validation/app";
import { api } from "~/lib/trpc/client";
import { cn, generateId, logInDevelopment } from "~/lib/utils";
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
import { useToast } from "../ui/use-toast";
import { type ManageClientFormSchema } from "./use-manage-client-form";

function ClientToDogRelationships({
	isNew,
	variant,
	setOpen,
}: {
	isNew: boolean;
	variant: "sheet" | "form";
	setOpen?: (open: boolean) => void;
}) {
	const { toast } = useToast();

	const router = useRouter();
	const form = useFormContext<ManageClientFormSchema>();

	const dogToClientRelationships = useFieldArray({
		control: form.control,
		name: "dogToClientRelationships",
		keyName: "rhf-id",
	});

	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);

	const searchDogsInputRef = React.useRef<HTMLInputElement>(null);

	const FieldsWrapper = variant === "sheet" ? FormSheetGroup : FormGroup;

	const context = api.useContext();

	const insertDogToClientRelationshipMutation = api.app.dogs.dogToClientRelationships.insert.useMutation();
	const deleteDogToClientRelationshipMutation = api.app.dogs.dogToClientRelationships.delete.useMutation();

	return (
		<>
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
								await deleteDogToClientRelationshipMutation.mutateAsync({
									id: confirmRelationshipDelete,
									dogId: dogToClientRelationships.fields.find(
										(relationship) => relationship.id === confirmRelationshipDelete,
									)!.dogId,
								});
							}

							form.setValue(
								"dogToClientRelationships",
								dogToClientRelationships.fields.filter((relationship) => relationship.id !== confirmRelationshipDelete),
								{ shouldDirty: false },
							);

							toast({
								title: "Deleted relationship",
								description: "The relationship has been successfully deleted.",
							});

							setConfirmRelationshipDelete(null);

							// HACK: Focus the combobox trigger after the dialog closes
							setTimeout(() => {
								searchDogsInputRef?.current?.focus();
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

			<FieldsWrapper title="Dogs" description="Manage the relationships between this client and their dogs.">
				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchDogsInputRef}
						placeholder={
							dogToClientRelationships.fields.length === 0
								? "Search dogs..."
								: dogToClientRelationships.fields.length === 1
								? "1 dog selected"
								: `${dogToClientRelationships.fields.length} dogs selected`
						}
						onSearch={async (searchTerm) => {
							const res = await context.app.dogs.search.fetch({ searchTerm });

							return res.data ?? [];
						}}
						resultLabel={(result) => `${result.givenName} ${result.familyName}`}
						selected={dogToClientRelationships.fields.map((dogToClientRelationship) => dogToClientRelationship.dog)}
						onSelect={async (dog) => {
							const selected = dogToClientRelationships.fields.find((relationship) => relationship.dogId === dog.id);

							if (selected) {
								setConfirmRelationshipDelete(selected.id);
								return;
							}

							const relationship = {
								id: generateId(),
								clientId: form.getValues("id"),
								dogId: dog.id,
								dog,
								relationship: "owner",
							} satisfies ManageClientFormSchema["dogToClientRelationships"][number];

							if (!isNew) {
								try {
									await insertDogToClientRelationshipMutation.mutateAsync(relationship);

									toast({
										title: "Created relationship",
										description: `Relationship between dog "${dog.givenName} ${dog.familyName}" and client ${
											form.getValues("givenName")
												? `"${form.getValues("givenName")} ${form.getValues("familyName")}"`
												: ""
										} has been successfully created.`,
									});
								} catch (error) {
									logInDevelopment(error);
									toast({
										title: "Failed to create relationship",
										description: `Relationship between "${dog.givenName} ${dog.familyName}" and client ${
											form.getValues("givenName")
												? `"${form.getValues("givenName")} ${form.getValues("familyName")}"`
												: ""
										} failed to create. Please try again.`,
									});
								}
							}

							form.setValue("dogToClientRelationships", [...dogToClientRelationships.fields, relationship], {
								shouldDirty: false,
							});
						}}
						renderActions={({ searchTerm }) => (
							<MultiSelectSearchComboboxAction
								onSelect={() => {
									router.push(`/dogs/new${searchTerm ? `?searchTerm=${searchTerm}` : ""}`);

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
								onDelete={() => {
									setConfirmRelationshipDelete(dogToClientRelationship.id);
								}}
								variant={variant}
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
	variant,
}: {
	dogToClientRelationship: ManageClientFormSchema["dogToClientRelationships"][number];
	index: number;
	onDelete: () => void;
	variant: "sheet" | "form";
}) {
	const { toast } = useToast();
	const form = useFormContext<ManageClientFormSchema>();
	const pathname = usePathname();

	const [isLoadingDogPage, setIsLoadingDogPage] = React.useState(false);

	const previousRelationship = React.useRef(dogToClientRelationship.relationship);

	const updateDogToClientRelationshipMutation = api.app.dogs.dogToClientRelationships.update.useMutation();

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
					<p className="truncate text-sm font-semibold capitalize leading-6 text-primary">
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
								value={field.value}
								onValueChange={(value) => {
									if (value !== field.value) {
										// Using form.setValue instead of field.onChange because we want to set shouldDirty to false
										form.setValue(`dogToClientRelationships.${index}.relationship`, value as typeof field.value, {
											shouldDirty: false,
										});

										updateDogToClientRelationshipMutation
											.mutateAsync({
												id: dogToClientRelationship.id,
												relationship: value as typeof field.value,
												dogId: dogToClientRelationship.dogId,
											})
											.then(() => {
												toast({
													title: "Updated relationship",
													description: `Relationship between dog "${dogToClientRelationship.dog.givenName} ${
														dogToClientRelationship.dog.familyName
													}" and client ${
														form.getValues("givenName")
															? `"${form.getValues("givenName")} ${form.getValues("familyName")}"`
															: ""
													} has been successfully created.`,
												});
											})
											.catch((error) => {
												logInDevelopment(error);

												// HACK: Reset the value to the previous value. Without the setTimeout, the value is not correctly reset
												setTimeout(() => {
													// Using form.setValue instead of field.onChange because we want to set shouldDirty to false
													form.setValue(
														`dogToClientRelationships.${index}.relationship`,
														previousRelationship.current,
														{
															shouldDirty: false,
														},
													);
												});

												toast({
													title: "Failed to update relationship relationship",
													description: `The relationship between dog "${dogToClientRelationship.dog.givenName} ${
														dogToClientRelationship.dog.familyName
													}" and client ${
														form.getValues("givenName")
															? `"${form.getValues("givenName")} ${form.getValues("familyName")}"`
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
											<span className="whitespace-nowrap capitalize">{field.value?.split("-").join(" ")}</span>
										</SelectValue>
									</SelectTrigger>
								</FormControl>
								<SelectContent withoutPortal={variant === "sheet"} align="end">
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
						<DropdownMenuTrigger className="flex items-center rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
							<span className="sr-only">Open options</span>
							<EllipsisVerticalIcon className="h-5 w-5" />
						</DropdownMenuTrigger>
						<DropdownMenuContent withoutPortal={variant === "sheet"} align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />

							{`/dogs/${dogToClientRelationship.dogId}` !== pathname && (
								<DropdownMenuItem asChild>
									<Link
										href={`/dogs/${dogToClientRelationship.dogId}`}
										onClick={() => {
											setIsLoadingDogPage(true);
										}}
										className="hover:cursor-pointer"
									>
										<EditIcon className="mr-2 h-4 w-4" />
										<span className="flex-1">Edit</span>
										{isLoadingDogPage && <Loader size="sm" variant="black" className="ml-2 mr-0" />}
									</Link>
								</DropdownMenuItem>
							)}

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
