"use client";

import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/api";
import { generateId } from "~/api/utils";
import { type ClientWithDogRelationships, type DogWithClientRelationships } from "~/db/drizzle-schema";
import { InsertDogSchema, type InsertDogClientRelationshipSchema } from "~/db/drizzle-zod";
import { useDidUpdate } from "~/hooks/use-did-update";
import { DogClientRelationships } from "./dog-client-relationships";
import { GeneralInformation } from "./general-information";

export const ManageDogFormSchema = InsertDogSchema.extend({
	givenName: InsertDogSchema.shape.givenName.max(50),
	breed: InsertDogSchema.shape.breed.max(50),
	age: InsertDogSchema.shape.age.max(5),
	color: InsertDogSchema.shape.color.max(50),
	notes: z
		.string()
		.max(500, {
			message: "Notes must be at most 500 characters long",
		})
		.nullish(),
});

export type ManageDogFormSchema = z.infer<typeof ManageDogFormSchema>;

function ManageDogForm({ dog }: { dog?: DogWithClientRelationships }) {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();

	const isNew = !params.id;

	const form = useForm<ManageDogFormSchema>({
		resolver: zodResolver(ManageDogFormSchema),
		defaultValues: {
			id: dog?.id || generateId(),
			...dog,
			clientRelationships: dog?.clientRelationships,
			actions: {
				clientRelationships: {},
			},
		},
	});

	useDidUpdate(() => {
		if (dog) {
			// All of this must be done as reset was overriding the dirty values of clientRelationships D:
			const currClientRelationships = form.getValues("clientRelationships").reduce((acc, curr) => {
				acc[curr.id] = curr;
				return acc;
			}, {} as Record<string, InsertDogClientRelationshipSchema & { client: ClientWithDogRelationships }>);

			for (const clientRelationship of dog.clientRelationships) {
				const existingClientRelationshipIndex = currClientRelationships[clientRelationship.id];
				const action = form.getValues(`actions.clientRelationships.${clientRelationship.id}`);

				if (existingClientRelationshipIndex) {
					if (!action || action.type !== "DELETE") {
						currClientRelationships[clientRelationship.id] = clientRelationship;
					}
				} else {
					if (!action) {
						currClientRelationships[clientRelationship.id] = clientRelationship;
					} else if (action.type === "UPDATE") {
						currClientRelationships[clientRelationship.id] = {
							...clientRelationship,
							...action.payload,
						};
					}
				}
			}

			form.reset(
				{
					...dog,
					clientRelationships: Object.values(currClientRelationships),
					actions: form.getValues("actions"),
				},
				{
					keepDirty: true,
					keepDirtyValues: true,
				},
			);
		}
	}, [dog, form]);

	async function onSubmit(data: ManageDogFormSchema) {
		let success = false;

		if (dog) {
			const response = await api.dogs.update(data);
			success = response.success;
		} else {
			const response = await api.dogs.insert(data);
			success = response.success;
		}

		if (success) {
			if (isNew) {
				router.replace(`/dogs/${data.id}`);
			} else {
				router.push("/dogs");
			}

			toast({
				title: `Dog ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} dog "${data.givenName}"`,
			});

			form.setValue("id", generateId());
		} else {
			toast({
				title: `Dog ${isNew ? "Creation" : "Update"} Failed`,
				description: `Failed to ${isNew ? "create" : "update"} dog "${data.givenName}"`,
			});
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)} className="space-y-10 ">
				<GeneralInformation control={form.control} />

				<Separator />

				<div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
					<div>
						<h2 className="text-base font-semibold leading-7 text-foreground">Relationships</h2>
						<p className="text-sm leading-6 text-muted-foreground">
							Manage the relationships of this dog between other clients and vets within the system.
						</p>
					</div>
					<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-gray-900/5 md:col-span-2">
						<div className="space-y-8 sm:p-8">
							<DogClientRelationships control={form.control} />

							{/* <Separator /> */}

							{/* <DogVetRelationships /> */}
						</div>
					</div>
				</div>

				<Separator />

				<div className="flex justify-end space-x-4">
					<Button
						type="button"
						onClick={() => {
							router.push("/dogs");
						}}
						variant="outline"
					>
						Back
					</Button>
					<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}>
						{form.formState.isSubmitting && <Loader className="mr-2" size="sm" />}
						{isNew ? "Create" : "Update"} dog
					</Button>
				</div>
			</form>
		</Form>
	);
}

export { ManageDogForm };
