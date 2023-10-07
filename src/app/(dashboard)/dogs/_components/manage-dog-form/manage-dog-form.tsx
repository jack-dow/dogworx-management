"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { useDidUpdate } from "~/hooks/use-did-update";
import { useZodForm } from "~/hooks/use-zod-form";
import { api } from "~/lib/trpc/client";
import { generateId, hasTrueValue, logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";
import { Bookings } from "./bookings/bookings";
import { DogBasicInformation } from "./dog-basic-information";
import { DogToClientRelationships } from "./dog-to-client-relationships";
import { DogToVetRelationships } from "./dog-to-vet-relationships";

const ManageDogFormSchema = InsertDogSchema.extend({
	givenName: z.string().min(1, { message: "Required" }).max(50),
	breed: z.string().min(1, { message: "Required" }).max(50),
	color: z.string().min(1, { message: "Required" }).max(25),
	notes: z.string().max(100000).nullish(),
});
type ManageDogFormSchema = z.infer<typeof ManageDogFormSchema>;

function ManageDogForm({
	initialData,
	bookingTypes,
}: {
	initialData?: RouterOutputs["app"]["dogs"]["byId"];
	bookingTypes: RouterOutputs["app"]["bookingTypes"]["all"]["data"];
}) {
	const searchParams = useSearchParams();
	const params = useParams();
	const isNew = params.id === "new";
	const router = useRouter();
	const { toast } = useToast();

	const [isConfirmNavigationDialogOpen, setIsConfirmNavigationDialogOpen] = React.useState(false);
	const [isConfirmSubmittingDialogOpen, setIsConfirmSubmittingDialogOpen] = React.useState(false);

	const result = api.app.dogs.byId.useQuery({ id: params.id as string }, { initialData, enabled: !isNew });
	const dog = result.data?.data;

	const form = useZodForm({
		schema: ManageDogFormSchema,
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

	useDidUpdate(() => {
		if (dog) {
			// Keep existing bookings and remove any duplicates. Only need to do this for bookings since it has pagination.
			const bookings = [...dog.bookings, ...form.getValues("bookings")].filter((booking, index, self) => {
				return self.findIndex((b) => b.id === booking.id) === index;
			});

			form.reset(
				{
					...dog,
					bookings,
				},
				{
					keepDirty: true,
					keepDirtyValues: true,
				},
			);
		}
	}, [dog, form]);

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
					<DogBasicInformation />

					<Separator />

					<Bookings isNew={isNew} bookingTypes={bookingTypes} />

					<Separator />

					<FormSection
						title="Manage Relationships"
						description="Manage the relationships of this dog between other clients and vets within the system."
					>
						<DogToClientRelationships isNew={isNew} />

						<Separator className="my-4" />

						<DogToVetRelationships isNew={isNew} />
					</FormSection>

					<Separator />

					<div className="flex items-center justify-end space-x-3">
						{!isNew && (
							<>
								<DestructiveActionDialog
									name="dog"
									trigger="trash"
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
								<Separator orientation="vertical" className="h-4" />
							</>
						)}

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
