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
import { InsertDogSchema } from "~/db/validation/app";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { api } from "~/lib/trpc/client";
import { type RouterOutputs } from "~/server";
import { generateId, hasTrueValue, logInDevelopment } from "~/utils";
import { Bookings } from "./bookings";
import { DogBasicInformation } from "./dog-basic-information";
import { DogToClientRelationships } from "./dog-to-client-relationships";
import { DogToVetRelationships } from "./dog-to-vet-relationships";

const ManageDogFormSchema = InsertDogSchema.extend({
	givenName: z.string().max(50).nonempty({ message: "Required" }),
	breed: z.string().max(50).nonempty({ message: "Required" }),
	color: z.string().max(25).nonempty({ message: "Required" }),
	notes: z.string().max(100000).nullish(),
});
type ManageDogFormSchema = z.infer<typeof ManageDogFormSchema>;

function ManageDogForm({
	dog,
	bookingTypes,
}: {
	dog?: RouterOutputs["app"]["dogs"]["byId"]["data"];
	bookingTypes: RouterOutputs["app"]["bookingTypes"]["all"]["data"];
}) {
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
			bookings: [],
			dogToClientRelationships: [],
			dogToVetRelationships: [],
			...dog,
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty && !form.formState.isSubmitted);

	const insertMutation = api.app.dogs.insert.useMutation();
	const updateMutation = api.app.dogs.update.useMutation();
	const deleteMutation = api.app.dogs.delete.useMutation();

	React.useEffect(() => {
		if (searchParams.get("searchTerm")) {
			router.replace("/dogs/new");
		}
	}, [searchParams, router]);

	async function onSubmit(data: ManageDogFormSchema) {
		try {
			if (isNew) {
				await insertMutation.mutateAsync(data);
				router.replace(`/dogs/${data.id}`);
			} else {
				await updateMutation.mutateAsync(data);
				router.push("/dogs");
			}

			toast({
				title: `Dog ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} dog "${data.givenName}".`,
			});
		} catch (error) {
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

					<Bookings isNew={isNew} bookings={dog?.bookings} bookingTypes={bookingTypes} />

					<Separator />

					<FormSection
						title="Manage Relationships"
						description="Manage the relationships of this dog between other clients and vets within the system."
					>
						<DogToClientRelationships />

						<Separator className="my-4" />

						<DogToVetRelationships control={form.control} existingDogToVetRelationships={dog?.dogToVetRelationships} />
					</FormSection>

					<Separator />

					<div className="flex justify-end space-x-4">
						{!isNew && (
							<DestructiveActionDialog
								name="dog"
								onConfirm={async () => {
									try {
										await deleteMutation.mutateAsync({ id: form.getValues("id") });
										toast({
											title: `Dog deleted`,
											description: `Successfully deleted dog "${form.getValues("givenName")}".`,
										});
										router.push("/dogs");
									} catch (error) {
										logInDevelopment(error);

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
						<Button
							type="submit"
							disabled={form.formState.isSubmitting || (!isNew && !isFormDirty)}
							onClick={() => {
								const numOfErrors = Object.keys(form.formState.errors).length;
								if (numOfErrors > 0) {
									toast({
										title: `Form submission errors`,
										description: `There ${numOfErrors === 1 ? "is" : "are"} ${numOfErrors} error${
											numOfErrors > 1 ? "s" : ""
										} with your submission. Please fix them and resubmit.`,
										variant: "destructive",
									});
								}
							}}
						>
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
