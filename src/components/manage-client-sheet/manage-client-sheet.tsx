"use client";

import * as React from "react";
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
import { Form } from "~/components/ui/form";
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
import { useToast } from "~/components/ui/use-toast";
import {
	api,
	generateId,
	InsertClientSchema,
	InsertDogToClientRelationshipSchema,
	SelectDogSchema,
	type ClientInsert,
	type ClientsList,
	type ClientsSearch,
	type ClientUpdate,
} from "~/api";
import { prettyStringValidationMessage } from "~/lib/validations/utils";
import { ClientPersonalInformation } from "./client-personal-information";
import { ClientToDogRelationships } from "./client-to-dog-relationships";

const ManageClientSheetFormSchema = InsertClientSchema.extend({
	givenName: prettyStringValidationMessage("First name", 2, 50),
	familyName: prettyStringValidationMessage("Last name", 0, 50).optional(),
	emailAddress: prettyStringValidationMessage("Email address", 1, 75).email({
		message: "Email address must be a valid email",
	}),
	phoneNumber: prettyStringValidationMessage("Phone number", 9, 16),
	streetAddress: prettyStringValidationMessage("Stress address", 5, 75),
	city: prettyStringValidationMessage("City", 1, 50),
	state: prettyStringValidationMessage("State", 1, 25),
	postalCode: prettyStringValidationMessage("Postal code", 1, 15),
	notes: prettyStringValidationMessage("Notes", 0, 500).nullish(),
	dogToClientRelationships: z.array(InsertDogToClientRelationshipSchema.extend({ dog: SelectDogSchema })),
});

type ManageClientSheetFormSchema = z.infer<typeof ManageClientSheetFormSchema>;

type DefaultValues = Partial<ManageClientSheetFormSchema>;
type ExistingClient = ClientsList[number] | ClientsSearch[number];

type ManageClientSheetProps<ClientProp extends ExistingClient | undefined> =
	| {
			open: boolean;
			setOpen: (open: boolean) => void;

			onSuccessfulSubmit?: (client: ClientProp extends ExistingClient ? ClientUpdate : ClientInsert) => void;
			client?: ClientProp;
			defaultValues?: DefaultValues;
			withoutTrigger?: boolean;
	  }
	| {
			open?: undefined;
			setOpen?: null;

			onSuccessfulSubmit?: (client: ClientProp extends ExistingClient ? ClientUpdate : ClientInsert) => void;
			client?: ClientProp;
			defaultValues?: DefaultValues;
			withoutTrigger?: boolean;
	  };

function ManageClientSheet<ClientProp extends ExistingClient | undefined>({
	open,
	setOpen,
	onSuccessfulSubmit,
	withoutTrigger = false,
	client,
	defaultValues,
}: ManageClientSheetProps<ClientProp>) {
	const isNew = !client;

	const { toast } = useToast();

	const [_open, _setOpen] = React.useState(open || false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const form = useForm<ManageClientSheetFormSchema>({
		resolver: zodResolver(ManageClientSheetFormSchema),
		defaultValues: {
			id: client?.id || defaultValues?.id || generateId(),
			dogToClientRelationships: client?.dogToClientRelationships,
			...client,
			...defaultValues,
			actions: {
				dogToClientRelationships: {},
			},
		},
	});

	React.useEffect(() => {
		form.reset(
			{ ...client, actions: form.getValues("actions") },
			{
				keepDirtyValues: true,
			},
		);
	}, [client, form]);

	async function onSubmit(data: ManageClientSheetFormSchema) {
		let success = false;
		let newClient: ClientUpdate | ClientInsert | undefined;

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

					setInternalOpen(value);
					form.reset();
				}}
			>
				{!withoutTrigger && (
					<SheetTrigger asChild>
						<Button>Create Client</Button>
					</SheetTrigger>
				)}
				<SheetContent className="w-full sm:max-w-md md:max-w-lg xl:max-w-xl">
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
							<ClientPersonalInformation control={form.control} />

							<Separator className="my-4" />

							<ClientToDogRelationships control={form.control} isNew={isNew} />

							<Separator className="my-4" />

							<SheetFooter>
								<SheetClose asChild>
									<Button variant="outline">Cancel</Button>
								</SheetClose>
								<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}>
									{form.formState.isSubmitting && <Loader size="sm" />}
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
