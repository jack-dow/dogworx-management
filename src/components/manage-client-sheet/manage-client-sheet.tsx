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
	actions,
	type ClientInsert,
	type ClientRelationships,
	type ClientsList,
	type ClientsSearch,
	type ClientUpdate,
} from "~/actions";
import { InsertClientSchema, InsertDogToClientRelationshipSchema, SelectDogSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { generateId } from "~/lib/utils";
import { EmailOrPhoneNumberSchema } from "~/lib/validation";
import { ClientPersonalInformation } from "./client-personal-information";
import { ClientToDogRelationships } from "./client-to-dog-relationships";

const ManageClientSheetFormSchema = z.intersection(
	InsertClientSchema.extend({
		givenName: z.string().max(50).nonempty({ message: "Required" }),
		familyName: z.string().max(50).or(z.literal("")).optional(),
		streetAddress: z.string().max(255).optional(),
		city: z.string().max(50).optional(),
		state: z.string().max(50).optional(),
		postalCode: z.string().max(10).optional(),
		notes: z.string().max(500).nullish(),
		dogToClientRelationships: z.array(InsertDogToClientRelationshipSchema.extend({ dog: SelectDogSchema })),
	}),
	EmailOrPhoneNumberSchema,
);

type ManageClientSheetFormSchema = z.infer<typeof ManageClientSheetFormSchema>;

type DefaultValues = Partial<ManageClientSheetFormSchema>;
type ExistingClient = Omit<ClientsList[number] | ClientsSearch[number], keyof ClientRelationships> &
	Partial<ClientRelationships>;

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
	const [isLoadingRelationships, setIsLoadingRelationships] = React.useState(false);

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
	useConfirmPageNavigation(form.formState.isDirty);

	if (Object.keys(form.formState.errors).length > 0) {
		console.log(form.formState.errors);
	}

	React.useEffect(() => {
		function syncClient(client: ExistingClient) {
			form.reset(
				{ ...client, actions: form.getValues("actions") },
				{
					keepDirtyValues: true,
				},
			);
		}
		if (client) {
			if (!client.dogToClientRelationships) {
				setIsLoadingRelationships(true);
				const fetchRelationships = async () => {
					const response = await actions.app.clients.getRelationships(client.id);
					if (response.success) {
						syncClient({
							...client,
							dogToClientRelationships: response.data.dogToClientRelationships,
						});
					} else {
						toast({
							title: "Failed to fetch client relationships",
							description:
								"An unknown error occurred whilst trying to get this vet's relationships. Please try again later.",
						});
					}
					setIsLoadingRelationships(false);
				};
				void fetchRelationships();
			}

			syncClient(client);
		}
	}, [client, form, toast]);

	async function onSubmit(data: ManageClientSheetFormSchema) {
		let success = false;
		let newClient: ClientUpdate | ClientInsert | undefined;

		if (client) {
			const response = await actions.app.clients.update(data);
			success = response.success && !!response.data;
			newClient = response.data;
		} else {
			const response = await actions.app.clients.insert(data);
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

							<ClientToDogRelationships control={form.control} isNew={isNew} isLoading={isLoadingRelationships} />

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
