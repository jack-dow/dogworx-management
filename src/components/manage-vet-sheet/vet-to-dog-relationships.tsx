"use client";

import * as React from "react";
import Link from "next/link";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

import { DogIcon, EditIcon, EllipsisVerticalIcon, TrashIcon } from "~/components/ui/icons";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { InsertDogToVetRelationshipSchema } from "~/api";
import { RelationshipLoadingSkeleton } from "../relationship-loading-skeleton";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { type ManageVetSheetFormSchema } from "./manage-vet-sheet";

function VetToDogRelationships({
	control,
	isNew,
	isLoading,
}: {
	control: Control<ManageVetSheetFormSchema>;
	isNew: boolean;
	isLoading: boolean;
}) {
	const { getValues, setValue } = useFormContext<ManageVetSheetFormSchema>();

	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<
		ManageVetSheetFormSchema["dogToVetRelationships"][number] | null
	>(null);

	const dogToVetRelationships = useFieldArray({
		control,
		name: "dogToVetRelationships",
		keyName: "rhf-id",
	});

	function handleVetToDogRelationshipDelete() {
		if (confirmRelationshipDelete) {
			dogToVetRelationships.remove(
				dogToVetRelationships.fields.findIndex((relationship) => relationship.id === confirmRelationshipDelete.id),
			);

			setValue("actions.dogToVetRelationships", {
				...getValues("actions.dogToVetRelationships"),
				[confirmRelationshipDelete.id]: {
					type: "DELETE",
					payload: confirmRelationshipDelete.id,
				},
			});
		}
	}

	return (
		<>
			<DestructiveActionDialog
				title="Are you sure?"
				description="Once you save this vet, this relationship will be permanently deleted."
				open={!!confirmRelationshipDelete}
				onOpenChange={() => setConfirmRelationshipDelete(null)}
				actionText="Delete relationship"
				onConfirm={() => {
					handleVetToDogRelationshipDelete();
				}}
			/>

			<div>
				<div>
					<h2 className="text-base font-semibold leading-7 text-foreground">Dogs</h2>
					<p className="text-sm leading-6 text-muted-foreground">
						Manage the relationships between this vet and the dogs they treat.
					</p>
				</div>
				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-6">
					<div className="sm:col-span-6">
						<ul role="list" className="divide-y divide-slate-100">
							{isLoading
								? Array(3)
										.fill(undefined)
										.map((_, index) => (
											<li key={`v-t-d-${index}`}>
												<RelationshipLoadingSkeleton />
											</li>
										))
								: dogToVetRelationships.fields.map((dogToVetRelationship, index) => (
										<li key={dogToVetRelationship.id} className="flex items-center justify-between gap-x-6 py-4">
											<div className="flex items-center gap-x-4">
												<div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50">
													<DogIcon className="h-5 w-5" />
												</div>

												<div className="min-w-0 flex-auto">
													<p className="text-sm font-semibold capitalize leading-6 text-slate-900">
														{dogToVetRelationship.dog.givenName}
													</p>
													<p className="truncate text-xs capitalize leading-5 text-slate-500">
														{dogToVetRelationship.dog.color} {dogToVetRelationship.dog.breed}
													</p>
												</div>
											</div>
											<div className="flex space-x-4">
												<FormField
													control={control}
													name={`dogToVetRelationships.${index}.relationship`}
													rules={{ required: "Please select a relationship" }}
													defaultValue={dogToVetRelationship.relationship}
													render={({ field }) => (
														<FormItem>
															<Select
																onValueChange={(value) => {
																	field.onChange(value as typeof field.value);
																	setValue(`actions.dogToVetRelationships.${dogToVetRelationship.id}`, {
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
																		<SelectValue placeholder="Select a relation">
																			<span className="capitalize">{field.value?.split("-").join(" ")} Vet</span>
																		</SelectValue>
																	</SelectTrigger>
																</FormControl>
																<SelectContent withoutPortal>
																	<SelectGroup>
																		<SelectLabel>Relationships</SelectLabel>
																		{Object.values(InsertDogToVetRelationshipSchema.shape.relationship.Values).map(
																			(relation) => (
																				<SelectItem key={relation} value={relation} className="capitalize">
																					{relation.split("-").join(" ")} Vet
																				</SelectItem>
																			),
																		)}
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
														<DropdownMenuContent>
															<DropdownMenuLabel>Actions</DropdownMenuLabel>
															<DropdownMenuSeparator />

															<DropdownMenuItem asChild>
																<Link href={`/dogs/${dogToVetRelationship.dogId}`}>
																	<EditIcon className="mr-2 h-4 w-4" />
																	Edit
																</Link>
															</DropdownMenuItem>
															<DropdownMenuItem
																onSelect={() => {
																	if (isNew) {
																		handleVetToDogRelationshipDelete();
																	} else {
																		setConfirmRelationshipDelete(dogToVetRelationship);
																	}
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
								  ))}
						</ul>
					</div>
				</div>
			</div>
		</>
	);
}

export { VetToDogRelationships };
