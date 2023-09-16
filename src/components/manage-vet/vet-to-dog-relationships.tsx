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
import { InsertDogToVetRelationshipSchema } from "~/db/validation/app";
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
import { type ManageVetFormSchema } from "./use-manage-vet-form";

function VetToDogRelationships({
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
	const form = useFormContext<ManageVetFormSchema>();

	const dogToVetRelationships = useFieldArray({
		control: form.control,
		name: "dogToVetRelationships",
		keyName: "rhf-id",
	});

	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);

	const searchDogsInputRef = React.useRef<HTMLInputElement>(null);

	const FieldsWrapper = variant === "sheet" ? FormSheetGroup : FormGroup;

	const context = api.useContext();

	const insertDogToVetRelationshipMutation = api.app.dogs.dogToVetRelationships.insert.useMutation();
	const deleteDogToVetRelationshipMutation = api.app.dogs.dogToVetRelationships.delete.useMutation();

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
								await deleteDogToVetRelationshipMutation.mutateAsync({
									id: confirmRelationshipDelete,
								});
							}

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

			<FieldsWrapper title="Dogs" description="Manage the relationships between this vet and the dogs they treat.">
				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchDogsInputRef}
						placeholder={
							dogToVetRelationships.fields.length === 0
								? "Search dogs..."
								: dogToVetRelationships.fields.length === 1
								? "1 dog selected"
								: `${dogToVetRelationships.fields.length} dogs selected`
						}
						onSearch={async (searchTerm) => {
							const res = await context.app.dogs.search.fetch({ searchTerm });

							return res.data ?? [];
						}}
						resultLabel={(result) => `${result.givenName} ${result.familyName}`}
						selected={dogToVetRelationships.fields.map((dogToVetRelationship) => dogToVetRelationship.dog)}
						onSelect={async (dog) => {
							const relationship = {
								id: generateId(),
								vetId: form.getValues("id"),
								dogId: dog.id,
								dog,
								relationship: "primary",
							} satisfies ManageVetFormSchema["dogToVetRelationships"][number];

							if (!isNew) {
								try {
									await insertDogToVetRelationshipMutation.mutateAsync(relationship);

									toast({
										title: "Created relationship",
										description: `Relationship between dog "${dog.givenName} ${dog.familyName}" and vet ${
											form.getValues("givenName")
												? `"${form.getValues("givenName")} ${form.getValues("familyName")}"`
												: ""
										} has been successfully created.`,
									});
								} catch (error) {
									logInDevelopment(error);
									toast({
										title: "Failed to create relationship",
										description: `Relationship between "${dog.givenName} ${dog.familyName}" and vet ${
											form.getValues("givenName")
												? `"${form.getValues("givenName")} ${form.getValues("familyName")}"`
												: ""
										} failed to create. Please try again.`,
									});
								}
							}

							dogToVetRelationships.append(relationship);
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
						{dogToVetRelationships.fields.map((dogToVetRelationship, index) => (
							<VetToDogRelationship
								key={dogToVetRelationship.id}
								dogToVetRelationship={dogToVetRelationship}
								index={index}
								onDelete={() => {
									setConfirmRelationshipDelete(dogToVetRelationship.id);
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

function VetToDogRelationship({
	dogToVetRelationship,
	index,
	onDelete,
	variant,
}: {
	dogToVetRelationship: ManageVetFormSchema["dogToVetRelationships"][number];
	index: number;
	onDelete: () => void;
	variant: "sheet" | "form";
}) {
	const { toast } = useToast();
	const form = useFormContext<ManageVetFormSchema>();
	const pathname = usePathname();

	const [isLoadingDogPage, setIsLoadingDogPage] = React.useState(false);

	const [updatingRelationshipTo, setUpdatingRelationshipTo] = React.useState<
		keyof typeof InsertDogToVetRelationshipSchema.shape.relationship.Enum | null
	>(null);

	const updateDogToVetRelationshipMutation = api.app.dogs.dogToVetRelationships.update.useMutation();

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
					<p className="truncate text-sm font-semibold capitalize leading-6 text-primary">
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
								value={field.value}
								onValueChange={(value) => {
									if (value !== field.value) {
										setUpdatingRelationshipTo(value as typeof field.value);

										updateDogToVetRelationshipMutation
											.mutateAsync({
												id: dogToVetRelationship.id,
												relationship: value as typeof field.value,
											})
											.then(() => {
												field.onChange(value as typeof field.value);

												toast({
													title: "Updated relationship",
													description: `Relationship between dog "${dogToVetRelationship.dog.givenName} ${
														dogToVetRelationship.dog.familyName
													}" and vet ${
														form.getValues("givenName")
															? `"${form.getValues("givenName")} ${form.getValues("familyName")}"`
															: ""
													} has been successfully created.`,
												});
											})
											.catch((error) => {
												logInDevelopment(error);

												toast({
													title: "Failed to update relationship relationship",
													description: `The relationship between dog "${dogToVetRelationship.dog.givenName} ${
														dogToVetRelationship.dog.familyName
													}" and vet ${
														form.getValues("givenName")
															? `"${form.getValues("givenName")} ${form.getValues("familyName")}"`
															: ""
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
											<span className="whitespace-nowrap capitalize">{field.value?.split("-").join(" ")} Vet</span>
										</SelectValue>
									</SelectTrigger>
								</FormControl>
								<SelectContent withoutPortal={variant === "sheet"} align="end">
									<SelectGroup>
										<SelectLabel>Relationships</SelectLabel>
										{Object.values(InsertDogToVetRelationshipSchema.shape.relationship.Values).map((relation) => (
											<SelectItem
												key={relation}
												value={relation}
												className="capitalize"
												isLoading={updatingRelationshipTo === relation}
											>
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
						<DropdownMenuContent withoutPortal={variant === "sheet"} align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />

							{`/dogs/${dogToVetRelationship.dogId}` !== pathname && (
								<DropdownMenuItem asChild>
									<Link
										href={`/dogs/${dogToVetRelationship.dogId}`}
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

export { VetToDogRelationships };
