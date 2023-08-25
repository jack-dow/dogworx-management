"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { ConfirmFormNavigationDialog } from "~/components/ui/confirm-form-navigation-dialog";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Form, FormSection } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import { actions, type DogById } from "~/actions";
import { InsertDogSchema, InsertDogToVetRelationshipSchema, SelectVetSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { useDidUpdate } from "~/hooks/use-did-update";
import { generateId, hasTrueValue, mergeRelationships } from "~/utils";
import { Bookings } from "./bookings";
import { DogBasicInformation } from "./dog-basic-information";
import { DogToClientRelationships } from "./dog-to-client-relationships";
import { DogToVetRelationships } from "./dog-to-vet-relationships";

const ManageDogFormSchema = InsertDogSchema.extend({
	givenName: z.string().max(50).nonempty({ message: "Required" }),
	breed: z.string().max(50).nonempty({ message: "Required" }),
	color: z.string().max(25).nonempty({ message: "Required" }),
	notes: z.string().max(100000).nullish(),
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
				bookings: {},
				dogToClientRelationships: {},
				dogToVetRelationships: {},
			},
			unsavedSessionIds: [],
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty && !form.formState.isSubmitted);

	useDidUpdate(() => {
		if (dog) {
			const actions = form.getValues("actions");

			form.reset(
				{
					...dog,
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
			if (isNew) {
				router.replace(`/dog/${data.id}`);
			} else {
				router.push("/dogs");
			}

			toast({
				title: `Dog ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} dog "${data.givenName}".`,
			});

			form.setValue("id", generateId());
		} else {
			toast({
				title: `Dog ${isNew ? "Creation" : "Update"} Failed`,
				description: `Failed to ${isNew ? "create" : "update"} dog "${data.givenName}". Please try again.`,
				variant: "destructive",
			});
		}
	}

	return (
		<>
			<ConfirmFormNavigationDialog
				open={isConfirmNavigationDialogOpen}
				onOpenChange={setIsConfirmNavigationDialogOpen}
				onConfirm={() => {
					router.back();
				}}
			/>

			<Dialog open={isConfirmSubmittingDialogOpen} onOpenChange={setIsConfirmSubmittingDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Uncommitted changes</DialogTitle>
						<DialogDescription>
							Are you sure you want to submit this form? If you do, any uncommitted changes will be lost.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsConfirmSubmittingDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								form.setValue("unsavedSessionIds", []);
								void form.handleSubmit(onSubmit)();
							}}
						>
							Continue
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Form {...form}>
				<form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)} className="space-y-6 lg:space-y-10">
					<DogBasicInformation control={form.control} />

					<Separator />

					<Bookings isNew={isNew} bookings={dog?.bookings} />

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
						{!isNew && (
							<DestructiveActionDialog
								name="dog"
								onConfirm={async () => {
									const result = await actions.app.dogs.delete(form.getValues("id"));

									if (result.success) {
										toast({
											title: `Dog deleted`,
											description: `Successfully deleted dog "${form.getValues("givenName")}".`,
										});
										router.push("/dogs");
									} else {
										toast({
											title: `Dog deletion failed`,
											description: `There was an error deleting dog "${form.getValues(
												"givenName",
											)}". Please try again.`,
											variant: "destructive",
										});
									}
								}}
							/>
						)}

						<Button
							type="button"
							onClick={() => {
								if (isFormDirty) {
									setIsConfirmNavigationDialogOpen(true);
								} else {
									router.back();
								}
							}}
							variant="outline"
						>
							Back
						</Button>
						<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !isFormDirty)}>
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
