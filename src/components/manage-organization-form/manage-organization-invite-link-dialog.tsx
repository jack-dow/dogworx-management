"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { init } from "@paralleldrive/cuid2";
import { useForm } from "react-hook-form";
import { type z } from "zod";

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
	DialogTrigger,
} from "~/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Loader } from "~/components/ui/loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/components/ui/use-toast";
import { actions, type OrganizationInviteLinkById } from "~/actions";
import { useUser } from "~/app/providers";
import { organizationRoleOptions } from "~/db/schema";
import { InsertOrganizationInviteLinkSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { useDayjs } from "~/hooks/use-dayjs";
import { cn, hasTrueValue, secondsToHumanReadable } from "~/utils";

const createInviteLinkCode = init({
	length: 8,
});

const ManageOrganizationInviteLinkFormSchema = InsertOrganizationInviteLinkSchema;

type ManageOrganizationInviteLinkFormSchema = z.infer<typeof ManageOrganizationInviteLinkFormSchema>;

interface ManageOrganizationInviteLinkDialogProps
	extends Omit<ManageOrganizationInviteLinkDialogFormProps, "setOpen" | "onConfirmCancel" | "setIsDirty" | "isNew"> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
}

function ManageOrganizationInviteLinkDialog(props: ManageOrganizationInviteLinkDialogProps) {
	const user = useUser();

	// This is in state so that we can use the invite link prop as the open state as well when using the sheet without having a flash between update/new state on sheet closing
	const [isNew, setIsNew] = React.useState(!props.organizationInviteLink);

	const [_open, _setOpen] = React.useState(props.open);
	const [isDirty, setIsDirty] = React.useState(false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = props.open ?? _open;
	const setInternalOpen = props.setOpen ?? _setOpen;

	React.useEffect(() => {
		if (internalOpen) {
			setIsNew(!props.organizationInviteLink);
			return;
		}
	}, [internalOpen, props.organizationInviteLink]);

	if (user.organizationRole === "member") {
		return null;
	}

	return (
		<>
			<ConfirmFormNavigationDialog
				open={isConfirmCloseDialogOpen}
				onOpenChange={setIsConfirmCloseDialogOpen}
				onConfirm={() => {
					setInternalOpen(false);
					setIsConfirmCloseDialogOpen(false);
				}}
			/>

			<Dialog
				open={internalOpen}
				onOpenChange={(value) => {
					if (isDirty && value === false) {
						setIsConfirmCloseDialogOpen(true);
						return;
					}

					setInternalOpen(value);
				}}
			>
				{!props.withoutTrigger && (
					<DialogTrigger asChild>{props.trigger ?? <Button>Generate invite link</Button>}</DialogTrigger>
				)}

				<DialogContent>
					<DialogHeader>
						<DialogTitle>{isNew ? "Create" : "Manage"} Organization Invite Link</DialogTitle>
						<DialogDescription>
							Use this dialog to {isNew ? "create" : "update"} an invite link. Click {isNew ? "create" : "update"}{" "}
							invite link when you&apos;re finished.
						</DialogDescription>
					</DialogHeader>

					{/* Put actual form in a separate component inside DialogContent so that it gets unmounted when the dialog is hidden, therefore resetting the form state */}
					<ManageOrganizationInviteLinkDialogForm
						{...props}
						setOpen={setInternalOpen}
						onConfirmCancel={() => {
							setIsConfirmCloseDialogOpen(true);
						}}
						setIsDirty={setIsDirty}
						isNew={isNew}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}

type ManageOrganizationInviteLinkDialogFormProps = {
	setOpen: (open: boolean) => void;
	setIsDirty: (isDirty: boolean) => void;
	onConfirmCancel: () => void;
	isNew: boolean;
	organizationInviteLink?: OrganizationInviteLinkById;
	defaultValues?: Partial<ManageOrganizationInviteLinkFormSchema>;
	onSubmit?: (data: ManageOrganizationInviteLinkFormSchema) => void;
	onDelete?: (id: string) => Promise<void>;
};

function ManageOrganizationInviteLinkDialogForm({
	setOpen,
	setIsDirty,
	onConfirmCancel,
	isNew,
	organizationInviteLink,
	defaultValues,
	onSubmit,
	onDelete,
}: ManageOrganizationInviteLinkDialogFormProps) {
	const { toast } = useToast();
	const { dayjs } = useDayjs();

	const user = useUser();

	const form = useForm<ManageOrganizationInviteLinkFormSchema>({
		resolver: zodResolver(ManageOrganizationInviteLinkFormSchema),
		defaultValues: {
			organizationId: user.organizationId,
			role: "member",
			maxUses: null,
			...organizationInviteLink,
			...defaultValues,
			userId: organizationInviteLink?.userId || defaultValues?.userId || user.id,
			id: organizationInviteLink?.id ?? createInviteLinkCode(),
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	React.useEffect(() => {
		function syncOrganizationInviteLink(organizationInviteLink: OrganizationInviteLinkById) {
			form.reset(
				{
					...organizationInviteLink,
					userId: organizationInviteLink.userId || user.id,
				},
				{
					keepDirty: true,
					keepDirtyValues: true,
				},
			);
		}

		if (organizationInviteLink) {
			syncOrganizationInviteLink(organizationInviteLink);
		}
	}, [organizationInviteLink, form, user.id]);

	React.useEffect(() => {
		setIsDirty(form.formState.isDirty);
	}, [form.formState.isDirty, setIsDirty]);

	return (
		<Form {...form}>
			<form
				className="grid gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();

					void form.handleSubmit(async (data) => {
						try {
							let success = false;

							if (onSubmit) {
								onSubmit(data);
								setOpen(false);
								return;
							}

							if (organizationInviteLink) {
								const response = await actions.auth.organizations.inviteLinks.update(data);
								success = response.success && !!response.data;
							} else {
								const response = await actions.auth.organizations.inviteLinks.insert(data);
								success = response.success;
							}

							if (success) {
								toast({
									title: `Invite link ${isNew ? "Created" : "Updated"}`,
									description: `Successfully ${isNew ? "created" : "updated"} invite link.`,
								});
							} else {
								toast({
									title: `Invite link ${isNew ? "Creation" : "Update"} Failed`,
									description: `There was an error ${
										isNew ? "creating" : "updating"
									} the invite link. Please try again.`,
									variant: "destructive",
								});
							}

							setOpen(false);
						} catch (error) {
							if (process.env.NODE_ENV === "development") {
								console.error(error);
							}
						}
					})(e);
				}}
			>
				<FormField
					control={form.control}
					name="expiresAt"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Expire After</FormLabel>
							<Select
								onValueChange={(value) => {
									field.onChange(dayjs().add(Number(value), "second").toDate());
								}}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue>
											{/* This is required because field is black for a second on page load otherwise */}
											<span className={cn(field.value && "capitalize")}>
												{field.value ? dayjs.tz(field.value).format("MMMM Do, YYYY") : "Select a time"}
											</span>
										</SelectValue>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{[1800, 3600, 7200, 10800, 21600, 43200, 86400].map((seconds) => (
										<SelectItem key={seconds} value={`${seconds}`}>
											{secondsToHumanReadable(seconds)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="maxUses"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Maximum uses</FormLabel>
							<Select
								onValueChange={(value) => {
									if (value === "Infinity") {
										field.onChange(null);
										return;
									}
									field.onChange(Number(value));
								}}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue>
											{/* This is required because field is black for a second on page load otherwise */}
											<span className={cn(field.value && "capitalize")}>{field.value ?? "No limit"}</span>
										</SelectValue>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="Infinity">No limit</SelectItem>
									{[1, 5, 10, 25, 50, 100].map((uses) => (
										<SelectItem key={uses} value={`${uses}`}>
											{uses} uses
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="role"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Role</FormLabel>
							<FormControl>
								<Tabs
									value={field.value}
									onValueChange={(value) => {
										field.onChange(value);
									}}
									className="w-full"
								>
									<TabsList className="grid w-full grid-cols-2">
										{organizationRoleOptions.map((option) => {
											if (option === "owner") {
												return null;
											}

											return (
												<TabsTrigger key={option} value={option} className="capitalize">
													{option}
												</TabsTrigger>
											);
										})}
									</TabsList>
								</Tabs>
							</FormControl>

							<FormMessage />
						</FormItem>
					)}
				/>

				<DialogFooter className="mt-2">
					{!isNew && onDelete && (
						<DestructiveActionDialog
							name="invite link"
							onConfirm={async () => {
								await onDelete(form.getValues("id"));
							}}
						/>
					)}

					<Button
						variant="outline"
						onClick={() => {
							if (form.formState.isDirty) {
								onConfirmCancel();
								return;
							}

							setOpen(false);
						}}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={form.formState.isSubmitting || (!isNew && !form.formState.isDirty)}
						onClick={() => {
							const numOfErrors = Object.keys(form.formState.errors).length;
							console.log(form.formState.errors);
							console.log(form.getValues());
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
						{!isNew ? "Update invite link" : "Create invite link"}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}

export {
	type ManageOrganizationInviteLinkDialogProps,
	type ManageOrganizationInviteLinkFormSchema,
	ManageOrganizationInviteLinkDialog,
};
