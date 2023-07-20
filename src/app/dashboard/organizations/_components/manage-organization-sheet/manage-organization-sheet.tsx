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
	type OrganizationInsert,
	type OrganizationsList,
	type OrganizationsSearch,
	type OrganizationUpdate,
} from "~/api";
import { InsertOrganizationInviteLinks, InsertOrganizationSchema, SelectUserSchema } from "~/db/zod-validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { OrganizationInformation } from "./organization-information";
import { OrganizationInviteLinks } from "./organization-invite-links";

const ManageOrganizationSheetFormSchema = InsertOrganizationSchema.extend({
	name: z.string().max(50).nonempty({ message: "Required" }),
	organizationInviteLinks: z.array(
		InsertOrganizationInviteLinks.extend({
			user: SelectUserSchema.extend({
				// User from session has dates as strings since you can't store dates in JWT
				createdAt: z.union([z.string(), z.date()]),
				updatedAt: z.union([z.string(), z.date()]),
			}),
		}),
	),
});
type ManageOrganizationSheetFormSchema = z.infer<typeof ManageOrganizationSheetFormSchema>;

type DefaultValues = Partial<ManageOrganizationSheetFormSchema>;
type ExistingOrganization = OrganizationsList[number] | OrganizationsSearch[number];

type ManageOrganizationSheetProps<OrganizationProp extends ExistingOrganization | undefined> =
	| {
			open: boolean;
			setOpen: (open: boolean) => void;
			onSuccessfulSubmit?: (
				organization: OrganizationProp extends ExistingOrganization ? OrganizationUpdate : OrganizationInsert,
			) => void;
			organization?: OrganizationProp;
			defaultValues?: DefaultValues;
			withoutTrigger?: boolean;
	  }
	| {
			open?: undefined;
			setOpen?: null;
			onSuccessfulSubmit?: (
				organization: OrganizationProp extends ExistingOrganization ? OrganizationUpdate : OrganizationInsert,
			) => void;
			organization?: OrganizationProp;
			defaultValues?: DefaultValues;
			withoutTrigger?: boolean;
	  };

function ManageOrganizationSheet<OrganizationProp extends ExistingOrganization | undefined>({
	open,
	setOpen,
	onSuccessfulSubmit,
	withoutTrigger = false,
	organization,
	defaultValues,
}: ManageOrganizationSheetProps<OrganizationProp>) {
	const isNew = !organization;

	const { toast } = useToast();

	const [_open, _setOpen] = React.useState(open || false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = open ?? _open;
	const setInternalOpen = setOpen ?? _setOpen;

	const form = useForm<ManageOrganizationSheetFormSchema>({
		resolver: zodResolver(ManageOrganizationSheetFormSchema),
		defaultValues: {
			id: generateId(),
			maxUsers: 5,
			organizationInviteLinks: [],
			...organization,
			...defaultValues,
			actions: {},
		},
	});
	useConfirmPageNavigation(form.formState.isDirty);

	if (Object.keys(form.formState.errors).length > 0) {
		console.log(form.formState.errors);
	}

	React.useEffect(() => {
		function syncOrganization(organization: ExistingOrganization) {
			form.reset(organization, {
				keepDirtyValues: true,
			});
		}

		if (organization) {
			syncOrganization(organization);
		}
	}, [organization, form, toast]);

	async function onSubmit(data: ManageOrganizationSheetFormSchema) {
		let success = false;
		let newOrganization: OrganizationUpdate | OrganizationInsert | undefined;

		if (organization) {
			const response = await api.organizations.update(data);
			success = response.success && !!response.data;
			newOrganization = response.data;
		} else {
			const response = await api.organizations.insert(data);
			success = response.success;
			newOrganization = response.data;
		}

		if (success) {
			if (newOrganization && onSuccessfulSubmit) {
				onSuccessfulSubmit(newOrganization);
			}

			toast({
				title: `Organization ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} organization "${data.name}"`,
			});

			setInternalOpen(false);
			form.reset();
		} else {
			toast({
				title: `Organization ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} organization "${
					data.name
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
						<Button>Create Organization</Button>
					</SheetTrigger>
				)}
				<SheetContent className="w-full sm:max-w-md md:max-w-lg xl:max-w-xl">
					<SheetHeader>
						<SheetTitle>{isNew ? "Create" : "Update"} Organization</SheetTitle>
						<SheetDescription>
							Use this form to {isNew ? "create" : "update"} a organization. Click {isNew ? "create" : "update"}{" "}
							organization when you&apos;re finished.
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
							<OrganizationInformation control={form.control} />

							<Separator className="my-4" />

							<OrganizationInviteLinks
								control={form.control}
								existingInviteLinks={organization?.organizationInviteLinks ?? []}
							/>

							<Separator className="my-4" />

							<SheetFooter>
								<SheetClose asChild>
									<Button variant="outline">Cancel</Button>
								</SheetClose>
								<Button type="submit" disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}>
									{form.formState.isSubmitting && <Loader size="sm" />}
									{isNew ? "Create" : "Update"} organization
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		</>
	);
}

export { type ManageOrganizationSheetFormSchema, ManageOrganizationSheet };
