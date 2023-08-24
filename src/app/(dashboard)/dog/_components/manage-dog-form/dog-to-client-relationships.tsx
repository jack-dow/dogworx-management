"use client";

import * as React from "react";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

import { ManageClient } from "~/components/manage-client";
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
import { actions, type ClientById, type ClientsSearch, type DogById } from "~/actions";
import { InsertDogToClientRelationshipSchema } from "~/db/validation";
import { cn, generateId } from "~/utils";
import { type ManageDogFormSchema } from "./manage-dog-form";

function DogToClientRelationships({
	control,
	existingDogToClientRelationships,
}: {
	control: Control<ManageDogFormSchema>;
	existingDogToClientRelationships: DogById["dogToClientRelationships"] | undefined;
}) {
	const form = useFormContext<ManageDogFormSchema>();

	const dogToClientRelationships = useFieldArray({
		control,
		name: "dogToClientRelationships",
		keyName: "rhf-id",
	});

	const [editingClient, setEditingClient] = React.useState<ClientById | null>(null);
	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<string | null>(null);
	const [isCreateClientSheetOpen, setIsCreateClientSheetOpen] = React.useState<string | null>(null);

	const searchClientsInputRef = React.useRef<HTMLInputElement>(null);

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
	}

	function toggleDogToClientRelationship(client: ClientsSearch[number]) {
		const relationshipId = dogToClientRelationships.fields.find(
			(clientRelationship) => clientRelationship.clientId === client.id,
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
			dogId: form.getValues("id"),
			clientId: client.id,
			relationship: "owner",
			client,
		});

		form.setValue("actions.dogToClientRelationships", {
			...form.getValues("actions.dogToClientRelationships"),
			[id]: {
				type: "INSERT",
				payload: {
					id,
					dogId: form.getValues("id"),
					clientId: client.id,
					relationship: "owner",
				},
			},
		});
	}

	return (
		<>
			<ManageClient
				variant="sheet"
				client={editingClient ?? undefined}
				open={!!editingClient}
				setOpen={(value) => {
					if (value === false) {
						setEditingClient(null);
					}
				}}
				withoutTrigger
				onSuccessfulSubmit={(client) => {
					dogToClientRelationships.fields.forEach((field, index) => {
						if (field.clientId === client.id) {
							form.setValue(`dogToClientRelationships.${index}.client`, client);
						}
					});
				}}
			/>

			<DestructiveActionDialog
				name="relationship"
				requiresSaveOf="dog"
				withoutTrigger
				open={!!confirmRelationshipDelete}
				onOpenChange={() => {
					setConfirmRelationshipDelete(null);
				}}
				onConfirm={() => {
					if (confirmRelationshipDelete) {
						handleDogToClientRelationshipDelete(confirmRelationshipDelete);
						// HACK: Focus the combobox trigger after the dialog closes
						setTimeout(() => {
							searchClientsInputRef?.current?.focus();
						}, 0);
					}
				}}
			/>

			<FormGroup title="Clients" description="Manage the relationships between this dog and clients.">
				<ManageClient
					variant="sheet"
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
						givenName: isCreateClientSheetOpen
							? isCreateClientSheetOpen?.split(" ").length === 1
								? isCreateClientSheetOpen
								: isCreateClientSheetOpen?.split(" ").slice(0, -1).join(" ")
							: undefined,
						familyName: isCreateClientSheetOpen
							? isCreateClientSheetOpen.split(" ").length > 1
								? isCreateClientSheetOpen.split(" ").pop()
								: undefined
							: undefined,
					}}
					onSuccessfulSubmit={(client) => {
						toggleDogToClientRelationship(client);
						searchClientsInputRef?.current?.focus();
					}}
					withoutTrigger
				/>

				<div className="sm:col-span-6">
					<MultiSelectSearchCombobox
						ref={searchClientsInputRef}
						resultLabel={(result) => `${result.givenName} ${result.familyName}`}
						selected={dogToClientRelationships.fields.map((dogToClientRelationship) => dogToClientRelationship.client)}
						onSelect={(client) => {
							toggleDogToClientRelationship(client);
						}}
						onSearch={async (searchTerm) => {
							const res = await actions.app.clients.search(searchTerm);

							return res.data ?? [];
						}}
						placeholder={
							dogToClientRelationships.fields.length === 0
								? "Search clients..."
								: dogToClientRelationships.fields.length === 1
								? "1 client selected"
								: `${dogToClientRelationships.fields.length} clients selected`
						}
						renderActions={({ searchTerm }) => (
							<MultiSelectSearchComboboxAction
								onSelect={() => {
									setIsCreateClientSheetOpen(searchTerm);
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
									onDelete={(client) => toggleDogToClientRelationship(client)}
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
	onDelete: (client: ClientsSearch[number]) => void;
}) {
	const { toast } = useToast();
	const form = useFormContext<ManageDogFormSchema>();

	const [isFetchingClient, setIsFetchingClient] = React.useState(false);
	return (
		<li
			key={dogToClientRelationship.id}
			className={cn("flex items-center justify-between gap-x-6", index === 0 ? "pb-4" : "py-4")}
		>
			<div className="flex items-center gap-x-2">
				<div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
					<UserCircleIcon className="h-5 w-5" />
				</div>

				<div className="min-w-0 flex-auto truncate">
					<p className="px-2 text-sm font-semibold leading-6 text-slate-900">
						{dogToClientRelationship.client.givenName} {dogToClientRelationship.client.familyName}
					</p>
					<div className="flex items-center space-x-2 truncate px-2">
						{dogToClientRelationship.client.emailAddress && (
							<ClickToCopy text={dogToClientRelationship.client.emailAddress}>
								<EnvelopeIcon className="mr-1 h-3 w-3" />
								{dogToClientRelationship.client.emailAddress}
							</ClickToCopy>
						)}
						{dogToClientRelationship.client.emailAddress && dogToClientRelationship.client.phoneNumber && (
							<span aria-hidden="true">&middot;</span>
						)}
						{dogToClientRelationship.client.phoneNumber && (
							<ClickToCopy text={dogToClientRelationship.client.phoneNumber}>
								<PhoneIcon className="mr-1 h-3 w-3" />
								{dogToClientRelationship.client.phoneNumber}
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
											<span className="truncate capitalize">{field.value?.split("-").join(" ")}</span>
										</SelectValue>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Relationships</SelectLabel>
										{Object.values(InsertDogToClientRelationshipSchema.shape.relationship.Values).map((relation) => (
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

									const renderErrorToast = () => {
										toast({
											title: "Failed to fetch client",
											description: "Something went wrong while fetching the client. Please try again.",
											variant: "destructive",
										});
									};

									setIsFetchingClient(true);

									actions.app.clients
										.byId(dogToClientRelationship.client.id)
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
									onDelete(dogToClientRelationship.client);
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
