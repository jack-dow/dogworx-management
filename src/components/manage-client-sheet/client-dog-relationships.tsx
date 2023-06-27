import { DogIcon, MoreVerticalIcon, Trash2Icon } from "lucide-react";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { type ClientWithDogRelationships } from "~/db/drizzle-schema";
import { InsertDogClientRelationshipSchema } from "~/db/drizzle-zod";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { Separator } from "../ui/separator";
import { type ManageClientSheetFormSchema } from "./manage-client-sheet";

function ClientDogRelationships({ control }: { control: Control<ManageClientSheetFormSchema> }) {
	const { setValue } = useFormContext<ManageClientSheetFormSchema>();
	const clientDogRelationships = useFieldArray({
		control,
		name: "dogRelationships",
		keyName: "rhfId",
	});

	if (clientDogRelationships.fields.length === 0) {
		return null;
	}

	return (
		<>
			<div>
				<div className="px-4 sm:px-0">
					<h2 className="text-base font-semibold leading-7 text-foreground">Dogs</h2>
					<p className="text-sm leading-6 text-muted-foreground">
						Manage the relationships between this client and their dogs.
					</p>
				</div>
				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-6">
					<div className="sm:col-span-6">
						<ul role="list" className="divide-y divide-gray-100">
							{clientDogRelationships.fields.map((dogRelationship, index) => (
								<li key={dogRelationship.id} className="flex items-center justify-between gap-x-6 py-4">
									<div className="flex items-center gap-x-4">
										<div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gray-50">
											<DogIcon className="h-5 w-5" />
										</div>
										{/* <img className="h-12 w-12 flex-none rounded-full bg-gray-50" src={person.imageUrl} alt="" /> */}
										<div className="min-w-0 flex-auto">
											<p className="text-sm font-semibold leading-6 text-gray-900">{dogRelationship.dog.givenName}</p>
											<p className="truncate text-xs leading-5 text-gray-500">{dogRelationship.dog.color}</p>
										</div>
									</div>
									<div className="flex space-x-4">
										<FormField
											control={control}
											name={`dogRelationships.${index}.relationship`}
											rules={{ required: "Please select a relationship" }}
											defaultValue={dogRelationship.relationship}
											render={({ field }) => (
												<FormItem>
													<Select
														onValueChange={(value) => {
															field.onChange(value as typeof field.value);
															setValue(`actions.dogRelationships.${dogRelationship.id}`, {
																type: "UPDATE",
																payload: {
																	...dogRelationship,
																	relationship: value as typeof field.value,
																},
															});
														}}
														defaultValue={field.value}
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
																{Object.values(InsertDogClientRelationshipSchema.shape.relationship.Values).map(
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
												<DropdownMenuTrigger className="flex items-center rounded-full text-gray-400 hover:text-gray-600  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
													<span className="sr-only">Open options</span>
													<MoreVerticalIcon className="h-5 w-5" />
												</DropdownMenuTrigger>
												<DropdownMenuContent>
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuSeparator />

													<DropdownMenuItem>
														<Trash2Icon className="mr-2 h-4 w-4" />
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
			<Separator className="my-4" />
		</>
	);
}

export { ClientDogRelationships };
