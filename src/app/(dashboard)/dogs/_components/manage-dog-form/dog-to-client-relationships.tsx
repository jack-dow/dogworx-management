"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { ManageClientSheet } from "~/components/manage-client/manage-client-sheet";
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
import { InsertDogToClientRelationshipSchema } from "~/db/validation/app";
import { cn, generateId, logInDevelopment } from "~/lib/client-utils";
import { api } from "~/lib/trpc/client";
import { type RouterOutputs } from "~/server";
import { type ManageDogFormSchema } from "./manage-dog-form";

type ClientById = NonNullable<RouterOutputs["app"]["clients"]["byId"]["data"]>;

function DogToClientRelationships({ isNew }: { isNew: boolean }) {
	const { toast } = useToast();
	const form = useFormContext<ManageDogFormSchema>();

	const dogToClientRelationships = useFieldArray({
		control: form.control,
		name: "dogToClientRelationships",
		keyName: "rhf-id",
	});

	const [editingClient, setEditingClient] = React.useState<ClientById | null>(null);
	const [isCreateClientSheetOpen, setIsCreateClientSheetOpen] = React.useState<true | string | null>(null);

	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);

	const searchClientsInputRef = React.useRef<HTMLInputElement>(null);

	const context = api.useContext();

	const insertDogToClientRelationshipMutation = api.app.dogs.dogToClientRelationships.insert.useMutation();
	const deleteDogToClientRelationshipMutation = api.app.dogs.dogToClientRelationships.delete.useMutation();

	return (
		<>
			<ManageClientSheet
				withoutTrigger
				open={!!editingClient}
				setOpen={(value) => {
					if (value === false) {
						setEditingClient(null);
					}
				}}
				client={editingClient ?? undefined}
				onSuccessfulSubmit={(client) => {
					const newDogToClientRelationships = [...dogToClientRelationships.fields].map((field) => {
						if (field.clientId === client.id) {
							return {
								...field,
								client: {
									...field.client,
									...client,
								},
							};
						}

						return field;
					});

					form.setValue("dogToClientRelationships", newDogToClientRelationships, { shouldDirty: false });
				}}
				onClientDelete={(id) => {
					form.setValue(
						"dogToClientRelationships",
						dogToClientRelationships.fields.filter((relationship) => relationship.clientId !== id),
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
								await deleteDogToClientRelationshipMutation.mutateAsync({
									id: confirmRelationshipDelete,
								});
							}

							// Use setValue instead of remove so that we can set shouldDirty to false
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
								searchClientsInputRef?.current?.focus();
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

			<FormGroup title="Clients" description="Manage the relationships between this dog and clients.">
				<ManageClientSheet
					open={!!isCreateClientSheetOpen}
					setOpen={(value) => {
						if (value === false) {
							setIsCreateClientSheetOpen(null);

							// HACK: Focus the input after the sheet closes
							setTimeout(() => {
								searchClientsInputRef?.current?.focus();
							}, 0);
						}
					}}
					defaultValues={{
						givenName:
							typeof isCreateClientSheetOpen === "string"
								? isCreateClientSheetOpen?.split(" ").length === 1
									? isCreateClientSheetOpen
									: isCreateClientSheetOpen?.split(" ").slice(0, -1).join(" ")
								: undefined,
						familyName:
							typeof isCreateClientSheetOpen === "string"
								? isCreateClientSheetOpen.split(" ").length > 1
									? isCreateClientSheetOpen.split(" ").pop()
									: undefined
								: undefined,
					}}
					onSuccessfulSubmit={() => {
						searchClientsInputRef?.current?.focus();
					}}
					withoutTrigger
				/>

				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchClientsInputRef}
						placeholder={
							dogToClientRelationships.fields.length === 0
								? "Search clients..."
								: dogToClientRelationships.fields.length === 1
								? "1 client selected"
								: `${dogToClientRelationships.fields.length} clients selected`
						}
						onSearch={async (searchTerm) => {
							const res = await context.app.clients.search.fetch({ searchTerm });

							return res.data ?? [];
						}}
						resultLabel={(result) => `${result.givenName} ${result.familyName}`}
						selected={dogToClientRelationships.fields.map((dogToClientRelationship) => dogToClientRelationship.client)}
						onSelect={async (client) => {
							const relationship = {
								id: generateId(),
								dogId: form.getValues("id"),
								clientId: client.id,
								client,
								relationship: "owner",
							} satisfies ManageDogFormSchema["dogToClientRelationships"][number];

							if (!isNew) {
								try {
									await insertDogToClientRelationshipMutation.mutateAsync(relationship);

									toast({
										title: "Created relationship",
										description: `Relationship between client "${client.givenName} ${client.familyName}" and dog ${
											form.getValues("givenName") ? `"${form.getValues("givenName")}"` : ""
										} has been successfully created.`,
									});
								} catch (error) {
									logInDevelopment(error);

									toast({
										title: "Failed to create relationship",
										description: `Relationship between client "${client.givenName} ${client.familyName}" and dog ${
											form.getValues("givenName") ? `"${form.getValues("givenName")}"` : ""
										} failed to create. Please try again.`,
									});
								}
							}

							dogToClientRelationships.append(relationship);
						}}
						renderActions={({ searchTerm }) => (
							<MultiSelectSearchComboboxAction
								onSelect={() => {
									setIsCreateClientSheetOpen(searchTerm || true);
								}}
							>
								<UserPlusIcon className="mr-2 h-4 w-4" />
								<span className="truncate">Create new client {searchTerm && `"${searchTerm}"`} </span>
							</MultiSelectSearchComboboxAction>
						)}
					/>
				</div>

				{dogToClientRelationships.fields.length > 0 && (
					<div className="sm:col-span-6">
						<ul role="list" className="divide-y divide-slate-100">
							{dogToClientRelationships.fields.map((dogToClientRelationship, index) => (
								<DogToClientRelationship
									key={dogToClientRelationship.id}
									dogToClientRelationship={dogToClientRelationship}
									index={index}
									onEdit={(client) => {
										setEditingClient(client);
									}}
									onDelete={() => {
										setConfirmRelationshipDelete(dogToClientRelationship.id);
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

function DogToClientRelationship({
	dogToClientRelationship,
	index,
	onEdit,
	onDelete,
}: {
	dogToClientRelationship: ManageDogFormSchema["dogToClientRelationships"][number];
	index: number;
	onEdit: (client: ClientById) => void;
	onDelete: () => void;
}) {
	const { toast } = useToast();
	const form = useFormContext<ManageDogFormSchema>();

	const context = api.useContext();

	const [isFetchingClient, setIsFetchingClient] = React.useState(false);

	const [updatingRelationshipTo, setUpdatingRelationshipTo] = React.useState<
		keyof typeof InsertDogToClientRelationshipSchema.shape.relationship.Enum | null
	>(null);

	const updateDogToClientRelationshipMutation = api.app.dogs.dogToClientRelationships.update.useMutation();

	return (
		<li
			key={dogToClientRelationship.id}
			className={cn("flex items-center justify-between gap-x-6", index === 0 ? "pb-4" : "py-4")}
		>
			<div className="flex shrink items-center gap-x-2 truncate">
				<div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
					<UserCircleIcon className="h-5 w-5" />
				</div>

				<div className="min-w-0 flex-auto">
					<p className="px-2 text-sm font-semibold leading-6 text-primary">
						{dogToClientRelationship.client.givenName} {dogToClientRelationship.client.familyName}
					</p>
					<div className="flex flex-col gap-y-2 truncate px-2 pt-1 md:flex-row md:items-center md:space-x-2 md:pt-0">
						{dogToClientRelationship.client.emailAddress && (
							<ClickToCopy text={dogToClientRelationship.client.emailAddress}>
								<EnvelopeIcon className="mr-1 h-3 w-3" />
								<span className="truncate">{dogToClientRelationship.client.emailAddress}</span>
							</ClickToCopy>
						)}
						{dogToClientRelationship.client.emailAddress && dogToClientRelationship.client.phoneNumber && (
							<span aria-hidden="true" className="hidden md:inline">
								&middot;
							</span>
						)}
						{dogToClientRelationship.client.phoneNumber && (
							<ClickToCopy text={dogToClientRelationship.client.phoneNumber}>
								<PhoneIcon className="mr-1 h-3 w-3" />
								<span className="truncate">{dogToClientRelationship.client.phoneNumber}</span>
							</ClickToCopy>
						)}
					</div>
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
										setUpdatingRelationshipTo(value as typeof field.value);

										updateDogToClientRelationshipMutation
											.mutateAsync({
												id: dogToClientRelationship.id,
												relationship: value as typeof field.value,
											})
											.then(() => {
												field.onChange(value as typeof field.value);

												toast({
													title: "Updated relationship",
													description: `The relationship between client "${dogToClientRelationship.client.givenName} ${
														dogToClientRelationship.client.familyName
													}" and dog ${
														form.getValues("givenName") ? `"${form.getValues("givenName")}"` : ""
													} has been successfully updated.`,
												});
											})
											.catch((error) => {
												logInDevelopment(error);

												toast({
													title: "Failed to update relationship",
													description: `The relationship between client "${dogToClientRelationship.client.givenName} ${
														dogToClientRelationship.client.familyName
													}" and dog ${
														form.getValues("givenName") ? `"${form.getValues("givenName")}"` : ""
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
								<SelectContent align="end">
									<SelectGroup>
										<SelectLabel>Relationships</SelectLabel>
										{Object.values(InsertDogToClientRelationshipSchema.shape.relationship.Values).map((relation) => (
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
						<DropdownMenuTrigger className="flex items-center rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
							<span className="sr-only">Open options</span>
							<EllipsisVerticalIcon className="h-5 w-5" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();

									setIsFetchingClient(true);

									context.app.clients.byId
										.fetch({ id: dogToClientRelationship.client.id })
										.then((result) => {
											if (!result.data) {
												throw new Error("No client found");
											}

											onEdit(result.data);
										})
										.catch(() => {
											toast({
												title: "Failed to fetch client",
												description: "Something went wrong while fetching the client. Please try again.",
												variant: "destructive",
											});
										})
										.finally(() => {
											setIsFetchingClient(false);
										});
								}}
							>
								<EditIcon className="mr-2 h-4 w-4" />
								<span className="flex-1">Edit Client</span>
								{isFetchingClient && <Loader size="sm" variant="black" className="ml-2 mr-0" />}
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

export { DogToClientRelationships };
