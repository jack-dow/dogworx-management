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
import {
	api,
	InsertDogToVetRelationshipSchema,
	SelectClientSchema,
	SelectDogToVetRelationshipSchema,
	SelectVetClinicSchema,
	SelectVetSchema,
	SelectVetToVetClinicRelationshipSchema,
	UserSchema,
	type DogById,
} from "~/api";
import { generateId } from "~/api/utils";
import { InsertDogSessionSchema } from "~/api/validations/dog-sessions";
import {
	InsertDogToClientRelationshipSchema,
	SelectDogToClientRelationshipSchema,
} from "~/api/validations/dog-to-client-relationships";
import { InsertDogSchema, SelectDogSchema } from "~/api/validations/dogs";
import { useDidUpdate } from "~/hooks/use-did-update";
import { mergeRelationships } from "~/lib/utils";
import { prettyStringValidationMessage } from "~/lib/validations/utils";
import { BasicInformation } from "./basic-information";
import { DogToClientRelationships } from "./dog-to-client-relationships";
import { DogToVetRelationships } from "./dog-to-vet-relationships";
import { SessionHistory } from "./session-history";

const ClientSchema = SelectClientSchema.extend({
	dogToClientRelationships: z.array(
		SelectDogToClientRelationshipSchema.extend({
			dog: SelectDogSchema,
		}),
	),
});

const VetSchema = SelectVetSchema.extend({
	dogToVetRelationships: z.array(
		SelectDogToVetRelationshipSchema.extend({
			dog: SelectDogSchema,
		}),
	),
	vetToVetClinicRelationships: z.array(
		SelectVetToVetClinicRelationshipSchema.extend({
			vetClinic: SelectVetClinicSchema,
		}),
	),
});

const ManageDogFormSchema = InsertDogSchema.extend({
	givenName: prettyStringValidationMessage("Name", 2, 50),
	breed: prettyStringValidationMessage("Breed", 2, 50),
	color: prettyStringValidationMessage("Color", 2, 25),
	notes: prettyStringValidationMessage("Notes", 0, 500).nullish(),
	age: InsertDogSchema.shape.age.nullable(),
	sessions: z.array(
		InsertDogSessionSchema.extend({
			user: UserSchema.optional(),
		}),
	),
	dogToClientRelationships: z.array(
		InsertDogToClientRelationshipSchema.extend({
			client: ClientSchema,
		}),
	),
	dogToVetRelationships: z.array(
		InsertDogToVetRelationshipSchema.extend({
			vet: VetSchema,
		}),
	),
});

type ManageDogFormSchema = z.infer<typeof ManageDogFormSchema>;

function ManageDogForm({ dog }: { dog?: DogById }) {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();

	const isNew = !params.id;

	const form = useForm<ManageDogFormSchema>({
		resolver: zodResolver(ManageDogFormSchema),
		defaultValues: {
			id: dog?.id || generateId(),
			desexed: false,
			...dog,
			actions: {
				sessions: {},
				dogToClientRelationships: {},
			},
		},
	});

	useDidUpdate(() => {
		if (dog) {
			const actions = form.getValues("actions");
			form.reset(
				{
					...dog,
					sessions: form.getValues("sessions"),
					dogToClientRelationships: mergeRelationships(
						form.getValues("dogToClientRelationships"),
						dog.dogToClientRelationships,
						actions.dogToClientRelationships,
					),
					dogToVetRelationships: mergeRelationships(
						form.getValues("dogToVetRelationships"),
						dog.dogToVetRelationships,
						actions.dogToVetRelationships,
					),
					actions,
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

		if (data.age == null) {
			form.setError("age", {
				type: "manual",
				message: "Age is required",
			});
			return;
		}

		if (dog) {
			// Have to spread in the age as typescript is being dumb and not inferring it properly
			const response = await api.dogs.update({ ...data, age: data.age });
			success = response.success;
		} else {
			// Have to spread in the age as typescript is being dumb and not inferring it properly
			const response = await api.dogs.insert({ ...data, age: data.age });
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
			<form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)} className="space-y-6 lg:space-y-10 ">
				<BasicInformation control={form.control} />

				<Separator />

				<SessionHistory control={form.control} />

				<Separator />

				<div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 xl:gap-8">
					<div>
						<h2 className="text-base font-semibold leading-7 text-foreground">Relationships</h2>
						<p className="text-sm leading-6 text-muted-foreground">
							Manage the relationships of this dog between other clients and vets within the system.
						</p>
					</div>
					<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 md:col-span-2">
						<div className="sm:p-8">
							<DogToClientRelationships
								control={form.control}
								existingDogToClientRelationships={dog?.dogToClientRelationships}
							/>

							<Separator className="my-4" />

							<DogToVetRelationships
								control={form.control}
								existingDogToVetRelationships={dog?.dogToVetRelationships}
							/>
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
						{form.formState.isSubmitting && <Loader size="sm" />}
						{isNew ? "Create" : "Update"} dog
					</Button>
				</div>
			</form>
		</Form>
	);
}

export { ManageDogFormSchema, ManageDogForm };
