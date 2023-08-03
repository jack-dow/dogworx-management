"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
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
import { InsertDogToClientRelationshipSchema } from "~/db/validation";
import { type ManageClientFormSchema } from "./manage-client-form";

function ClientToDogRelationships({ control, isNew }: { control: Control<ManageClientFormSchema>; isNew: boolean }) {
	const router = useRouter();
	const form = useFormContext<ManageClientFormSchema>();
	const dogToClientRelationships = useFieldArray({
		control,
		name: "dogToClientRelationships",
		keyName: "rhf-id",
	});

	const [isConfirmingNavigationToDog, setIsConfirmingNavigationToDog] = React.useState<string | null>(null);

	const [confirmRelationshipDelete, setConfirmRelationshipDelete] = React.useState<
		ManageClientFormSchema["dogToClientRelationships"][number] | null
	>(null);

	function handleDogToClientRelationshipDelete(relationshipId: string) {
		dogToClientRelationships.remove(
			dogToClientRelationships.fields.findIndex((relationship) => relationship.id === relationshipId),
		);

		form.setValue("actions.dogToClientRelationships", {
			...form.getValues("actions.dogToClientRelationships"),
			[relationshipId]: {
				type: "DELETE",
				payload: relationshipId,
			},
		});
	}

	return (
		<>
			<ConfirmFormNavigationDialog
				open={!!isConfirmingNavigationToDog}
				onOpenChange={() => {
					setIsConfirmingNavigationToDog(null);
				}}
				onConfirm={() => {
					void router.push(`/clients/${isConfirmingNavigationToDog}`);
				}}
			/>

			<DestructiveActionDialog
				title="Are you sure?"
				description="Once you save this client, this relationship will be permanently deleted."
				open={!!confirmRelationshipDelete}
				onOpenChange={() => setConfirmRelationshipDelete(null)}
				actionText="Delete relationship"
				onConfirm={() => {
					if (confirmRelationshipDelete) {
						handleDogToClientRelationshipDelete(confirmRelationshipDelete.id);
					}
				}}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
				<div className="col-span-full">
					<h3 className="text-base font-semibold leading-7 text-slate-900">Dogs</h3>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">
						Manage the relationships between this client and their dogs.
					</p>
				</div>
				<div className="sm:col-span-6">
					<ul role="list" className="divide-y divide-slate-100">
						{dogToClientRelationships.fields.map((dogToClientRelationship, index) => (
							<li key={dogToClientRelationship.id} className="flex items-center justify-between gap-x-6 py-4">
								<div className="flex items-center gap-x-4">
									<div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50">
										<DogIcon className="h-5 w-5" />
									</div>
									{/* <img className="h-12 w-12 flex-none rounded-full bg-slate-50" src={person.imageUrl} alt="" /> */}
									<div className="min-w-0 flex-auto">
										<p className="text-sm font-semibold capitalize leading-6 text-slate-900">
											{dogToClientRelationship.dog.givenName}
										</p>
										<p className="truncate text-xs capitalize leading-5 text-slate-500">
											{dogToClientRelationship.dog.color}
										</p>
									</div>
								</div>
								<div className="flex space-x-4">
									<FormField
										control={control}
										name={`dogToClientRelationships.${index}.relationship`}
										rules={{ required: "Please select a relationship" }}
										defaultValue={dogToClientRelationship.relationship}
										render={({ field }) => (
											<FormItem>
												<Select
													onValueChange={(value) => {
														field.onChange(value as typeof field.value);
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
															<SelectValue placeholder="Select a relation">
																<span className="capitalize">{field.value?.split("-").join(" ")}</span>
															</SelectValue>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectGroup>
															<SelectLabel>Relationships</SelectLabel>
															{Object.values(InsertDogToClientRelationshipSchema.shape.relationship.Values).map(
																(relation) => (
																	<SelectItem key={relation} value={relation} className="capitalize">
																		{relation.split("-").join(" ")}
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

												{form.formState.isDirty ? (
													<DropdownMenuItem
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															setIsConfirmingNavigationToDog(dogToClientRelationship.dogId);
														}}
													>
														<EditIcon className="mr-2 h-4 w-4" />
														Edit
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem asChild>
														<Link href={`/dogs/${dogToClientRelationship.dogId}`}>
															<EditIcon className="mr-2 h-4 w-4" />
															Edit
														</Link>
													</DropdownMenuItem>
												)}

												<DropdownMenuItem
													onSelect={() => {
														if (isNew) {
															handleDogToClientRelationshipDelete(dogToClientRelationship.id);
														} else {
															setConfirmRelationshipDelete(dogToClientRelationship);
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
		</>
	);
}
export { ClientToDogRelationships };
