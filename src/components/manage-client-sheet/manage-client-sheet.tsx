"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { Separator } from "~/components/ui/separator";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet";
import { api } from "~/api";
import { generateId } from "~/api/utils";
import { type ClientWithDogRelationships } from "~/db/drizzle-schema";
import { InsertClientSchema } from "~/db/drizzle-zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";
import { Form } from "../ui/form";
import { useToast } from "../ui/use-toast";
import { ClientDogRelationships } from "./client-dog-relationships";
import { PersonalInformation } from "./personal-information";

const formSchema = InsertClientSchema.extend({
	givenName: InsertClientSchema.shape.givenName.max(50),
	familyName: z.string().max(50).optional(),
	emailAddress: InsertClientSchema.shape.emailAddress
		.email({
			message: "Email must be a valid email address",
		})
		.max(75),
	phoneNumber: InsertClientSchema.shape.phoneNumber
		.min(9, {
			message: "Phone number must be at least 9 characters long",
		})
		.max(16, {
			message: "Phone number must be at most 16 characters long",
		}),
	streetAddress: InsertClientSchema.shape.streetAddress.max(50),
	city: InsertClientSchema.shape.city.max(50),
	state: InsertClientSchema.shape.state.max(50),
	postalCode: InsertClientSchema.shape.postalCode.max(50),
	notes: z
		.string()
		.max(500, {
			message: "Notes must be at most 500 characters long",
		})
		.nullish(),
});

type ManageClientSheetFormSchema = z.infer<typeof formSchema>;

type DefaultValues = Partial<ManageClientSheetFormSchema>;

type ManageClientProps =
	| {
			open: boolean;
			setOpen: (open: boolean) => void;
			onSuccessfulSubmit?: (client: ClientWithDogRelationships) => void;
			defaultValues?: DefaultValues;
			client?: ClientWithDogRelationships;
			withoutTrigger?: boolean;
	  }
	| {
			open?: undefined;
			setOpen?: null;
			onSuccessfulSubmit?: (client: ClientWithDogRelationships) => void;
			client?: ClientWithDogRelationships;
			defaultValues?: DefaultValues;
			withoutTrigger?: boolean;
	  };

function ManageClientSheet({
	open,
	setOpen,
	onSuccessfulSubmit,
	withoutTrigger = false,
	client,
	defaultValues,
}: ManageClientProps) {
	const isNew = !client;

	const { toast } = useToast();

	const [_open, _setOpen] = useState(open || false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = useState(false);

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const form = useForm<ManageClientSheetFormSchema>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			id: client?.id || defaultValues?.id || generateId(),
			dogRelationships: client?.dogRelationships,
			...client,
			...defaultValues,
			actions: {
				dogRelationships: {},
			},
		},
	});

	useEffect(() => {
		form.reset(client, {
			keepDirtyValues: true,
		});
	}, [client, form]);

	async function onSubmit(data: ManageClientSheetFormSchema) {
		let success = false;
		let newClient: ClientWithDogRelationships | undefined;

		if (client) {
			const response = await api.clients.update(data);
			success = response.success && !!response.data;
			newClient = response.data;
		} else {
			const response = await api.clients.insert(data);
			success = response.success;
			newClient = response.data;
		}

		if (success) {
			if (newClient && onSuccessfulSubmit) {
				onSuccessfulSubmit(newClient);
			}

			toast({
				title: `Client ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} client "${data.givenName}${
					data.familyName ? " " + data.familyName : ""
				}"`,
			});

			setInternalOpen(false);
			form.reset();
		} else {
			toast({
				title: `Client ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} client "${data.givenName}${
					data.familyName ? " " + data.familyName : ""
				}". Please try again later.`,
			});
		}
	}

	return (
		<>
			<AlertDialog open={isConfirmCloseDialogOpen} onOpenChange={setIsConfirmCloseDialogOpen}>
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
								if (setOpen) setOpen(false);
								setInternalOpen(false);
								form.reset();
							}}
						>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Sheet
				open={internalOpen}
				onOpenChange={(value) => {
					// Form state check **MUST** be first otherwise a bug occurs where it is always false on the first close
					if (form.formState.isDirty && value === false) {
						setIsConfirmCloseDialogOpen(true);
						return;
					}

					if (setOpen) setOpen(value);
					setInternalOpen(value);
					form.reset();
				}}
			>
				{!withoutTrigger && (
					<SheetTrigger asChild>
						<Button>Create Client</Button>
					</SheetTrigger>
				)}
				<SheetContent size="xl">
					<SheetHeader>
						<SheetTitle>{isNew ? "Create" : "Update"} Client</SheetTitle>
						<SheetDescription>
							Use this form to {isNew ? "create" : "update"} a client. Click {isNew ? "create" : "update"} client when
							you&apos;re finished.
						</SheetDescription>
					</SheetHeader>

					<Separator className="my-4" />

					<Form {...form}>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								void form.handleSubmit(onSubmit)(e);
							}}
						>
							<PersonalInformation control={form.control} />

							<Separator className="my-4" />

							<ClientDogRelationships control={form.control} />

							{/* Separator is in ClientDogRelationships due to its dynamic-ness */}

							<SheetFooter>
								<SheetClose asChild>
									<Button variant="outline">Cancel</Button>
								</SheetClose>
								<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}>
									{form.formState.isSubmitting && <Loader className="mr-2" size="sm" />}
									{isNew ? "Create" : "Update"} client
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		</>
	);
}

export { type ManageClientSheetFormSchema, ManageClientSheet };
