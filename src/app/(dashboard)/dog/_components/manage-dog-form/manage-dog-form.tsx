"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Form, FormSection } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { actions, type DogById } from "~/actions";
import {
	InsertDogSchema,
	InsertDogSessionSchema,
	InsertDogToClientRelationshipSchema,
	InsertDogToVetRelationshipSchema,
	SelectClientSchema,
	SelectUserSchema,
	SelectVetSchema,
} from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { useDidUpdate } from "~/hooks/use-did-update";
import { generateId, mergeRelationships } from "~/utils";
import { DogBasicInformation } from "./dog-basic-information";
import { DogSessionsHistory } from "./dog-sessions-history";
import { DogToClientRelationships } from "./dog-to-client-relationships";
import { DogToVetRelationships } from "./dog-to-vet-relationships";

const ManageDogFormSchema = InsertDogSchema.extend({
	givenName: z.string().max(50).nonempty({ message: "Required" }),
	breed: z.string().max(50).nonempty({ message: "Required" }),
	color: z.string().max(25).nonempty({ message: "Required" }),
	notes: z.string().max(100000).nullish(),
	age: InsertDogSchema.shape.age,
	sessions: z.array(
		InsertDogSessionSchema.extend({
			user: SelectUserSchema.pick({
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				organizationId: true,
				organizationRole: true,
				profileImageUrl: true,
			}).nullable(),
		}),
	),
	dogToClientRelationships: z.array(
		InsertDogToClientRelationshipSchema.extend({
			client: SelectClientSchema.pick({
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			}),
		}),
	),
	dogToVetRelationships: z.array(
		InsertDogToVetRelationshipSchema.extend({
			vet: SelectVetSchema.pick({
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			}),
		}),
	),
	unsavedSessionIds: z.array(z.string()),
});

type ManageDogFormSchema = z.infer<typeof ManageDogFormSchema>;

function ManageDogForm({ dog }: { dog?: DogById }) {
	const searchParams = useSearchParams();
	const params = useParams();
	const isNew = !params.id;
	const router = useRouter();
	const { toast } = useToast();

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);
	const [isConfirmSubmittingDialogOpen, setIsConfirmSubmittingDialogOpen] = React.useState(false);

	const form = useForm<ManageDogFormSchema>({
		resolver: zodResolver(ManageDogFormSchema),
		defaultValues: {
			id: dog?.id || generateId(),
			givenName: searchParams.get("searchTerm") ?? undefined,
			desexed: false,
			isAgeEstimate: true,
			...dog,
			actions: {
				sessions: {},
				dogToClientRelationships: {},
				dogToVetRelationships: {},
			},
			unsavedSessionIds: [],
		},
	});
	useConfirmPageNavigation(form.formState.isDirty && !form.formState.isSubmitted);

	useDidUpdate(() => {
		if (dog) {
			const actions = form.getValues("actions");

			form.reset(
				{
					...dog,
					sessions: form.getValues("sessions"),
					dogToClientRelationships: mergeRelationships(
						form.getValues("dogToClientRelationships"),
						dog.dogToClientRelationships ?? [],
						actions.dogToClientRelationships,
					),
					dogToVetRelationships: mergeRelationships(
						form.getValues("dogToVetRelationships"),
						dog.dogToVetRelationships ?? [],
						actions.dogToVetRelationships,
					),
					actions,
					unsavedSessionIds: form.getValues("unsavedSessionIds"),
				},
				{
					keepDirty: true,
					keepDirtyValues: true,
				},
			);
		}
	}, [dog, form]);

	React.useEffect(() => {
		if (searchParams.get("searchTerm")) {
			router.replace("/dog/new");
		}
	}, [searchParams, router]);

	async function onSubmit(data: ManageDogFormSchema) {
		let success = false;

		if (data.unsavedSessionIds.length > 0) {
			setIsConfirmSubmittingDialogOpen(true);
			return;
		}

		if (dog) {
			// Have to spread in the age as typescript is being dumb and not inferring it properly
			const response = await actions.app.dogs.update({ ...data, age: data.age });
			success = response.success;
		} else {
			// Have to spread in the age as typescript is being dumb and not inferring it properly
			const response = await actions.app.dogs.insert({ ...data, age: data.age });
			success = response.success;
		}

		if (success) {
			router.push("/dogs");

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
		<>
			<AlertDialog open={isConfirmNavigationDialogOpen} onOpenChange={setIsConfirmNavigationDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Unsaved changes</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to close this form? If you do, any unsaved changes will be lost.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								router.back();
							}}
						>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={isConfirmSubmittingDialogOpen} onOpenChange={setIsConfirmSubmittingDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Uncommitted changes</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to submit this form? If you do, any uncommitted changes will be lost.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								form.setValue("unsavedSessionIds", []);
								void form.handleSubmit(onSubmit)();
							}}
						>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Form {...form}>
				<form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)} className="space-y-6 lg:space-y-10">
					<DogBasicInformation control={form.control} />

					<Separator />

					<DogSessionsHistory control={form.control} existingDogSessions={dog?.sessions ?? []} />

					<Separator />

					<FormSection
						title="Manage Relationships"
						description="Manage the relationships of this dog between other clients and vets within the system."
					>
						<DogToClientRelationships
							control={form.control}
							existingDogToClientRelationships={dog?.dogToClientRelationships}
						/>

						<Separator className="my-4" />

						<DogToVetRelationships control={form.control} existingDogToVetRelationships={dog?.dogToVetRelationships} />
					</FormSection>

					<Separator />

					<div className="flex justify-end space-x-4">
						<Button
							type="button"
							onClick={() => {
								if (form.formState.isDirty) {
									setIsConfirmNavigationDialogOpen(true);
								} else {
									router.back();
								}
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
		</>
	);
}

export { ManageDogFormSchema, ManageDogForm };
