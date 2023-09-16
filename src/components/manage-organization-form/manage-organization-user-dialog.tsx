"use client";

import * as React from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useForm, useFormContext } from "react-hook-form";
import { UAParser } from "ua-parser-js";
import { type z } from "zod";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
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
import { TrashIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Loader } from "~/components/ui/loader";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/components/ui/use-toast";
import { handleProfileImageUpload } from "~/app/(dashboard)/account/_components/manage-account-form";
import { useSession, useUser } from "~/app/providers";
import { organizationRoleOptions } from "~/db/schema/auth";
import { InsertUserSchema } from "~/db/validation/auth";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { useDayjs } from "~/hooks/use-dayjs";
import { cn, generateId, hasTrueValue, logInDevelopment } from "~/lib/client-utils";
import { api } from "~/lib/trpc/client";
import { type ManageOrganizationFormSchema } from "./manage-organization-form";

const ManageOrganizationUserFormSchema = InsertUserSchema;

type ManageOrganizationUserFormSchema = z.infer<typeof ManageOrganizationUserFormSchema>;

interface ManageOrganizationUserDialogProps
	extends Omit<ManageOrganizationUserDialogFormProps, "setOpen" | "onConfirmCancel" | "setIsDirty" | "isNew"> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	withoutTrigger?: boolean;
	trigger?: React.ReactNode;
}

function ManageOrganizationUserDialog(props: ManageOrganizationUserDialogProps) {
	// This is in state so that we can use the user prop as the open state as well when using the sheet without having a flash between update/new state on sheet closing
	const [isNew, setIsNew] = React.useState(!props.organizationUser);

	const user = useUser();

	const [_open, _setOpen] = React.useState(props.open);
	const [isDirty, setIsDirty] = React.useState(false);
	const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = React.useState(false);

	const internalOpen = props.open ?? _open;
	const setInternalOpen = props.setOpen ?? _setOpen;

	React.useEffect(() => {
		if (internalOpen) {
			setIsNew(!props.organizationUser);
			return;
		}
	}, [internalOpen, props.organizationUser]);

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
					<DialogTrigger asChild>{props.trigger ?? <Button>Create user</Button>}</DialogTrigger>
				)}

				<DialogContent className="xl:max-w-xl">
					<DialogHeader>
						<DialogTitle>{isNew ? "Create" : "Manage"} Organization User</DialogTitle>
						<DialogDescription>
							Use this dialog to {isNew ? "create" : "update"} a user. Click {isNew ? "create" : "update"} user when
							you&apos;re finished.
						</DialogDescription>
					</DialogHeader>

					{/* Put actual form in a separate component inside DialogContent so that it gets unmounted when the dialog is hidden, therefore resetting the form state */}
					<ManageOrganizationUserDialogForm
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

type ManageOrganizationUserDialogFormProps = {
	setOpen: (open: boolean) => void;
	setIsDirty: (isDirty: boolean) => void;
	onConfirmCancel: () => void;
	isNew: boolean;
	organizationUser?: ManageOrganizationFormSchema["organizationUsers"][number];
	defaultValues?: Partial<ManageOrganizationUserFormSchema>;
	onSuccessfulSubmit?: (data: ManageOrganizationUserFormSchema) => void;
	onDelete?: (id: string) => Promise<void>;
};

function ManageOrganizationUserDialogForm({
	setOpen,
	setIsDirty,
	onConfirmCancel,
	isNew,
	organizationUser,
	defaultValues,
	onSuccessfulSubmit,
	onDelete,
}: ManageOrganizationUserDialogFormProps) {
	const { toast } = useToast();

	const user = useUser();

	// Have to hold the file here because we need to upload as a File not a url and if you use a File in zod it errors when run on the server as File doesn't exist there
	const [uploadedProfileImage, setUploadedProfileImage] = React.useState<File | null>(null);

	const [isConfirmOwnershipChangeDialogOpen, setIsConfirmOwnershipChangeDialogOpen] = React.useState(false);

	const form = useForm<ManageOrganizationUserFormSchema>({
		resolver: zodResolver(ManageOrganizationUserFormSchema),
		defaultValues: {
			organizationId: user.organizationId,
			organizationRole: "member",
			...organizationUser,
			...defaultValues,
			id: organizationUser?.id ?? generateId(),
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	const insertMutation = api.auth.organizations.users.insert.useMutation();
	const updateMutation = api.auth.organizations.users.update.useMutation();

	React.useEffect(() => {
		function syncOrganizationUser(organizationUser: InsertUserSchema) {
			form.reset(organizationUser, {
				keepDirty: true,
				keepDirtyValues: true,
			});
		}

		if (organizationUser) {
			syncOrganizationUser(organizationUser);
		}
	}, [organizationUser, form]);

	React.useEffect(() => {
		setIsDirty(form.formState.isDirty);
	}, [form.formState.isDirty, setIsDirty]);

	function _onSubmit(e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>) {
		e.preventDefault();
		e.stopPropagation();

		void form.handleSubmit(async (data) => {
			if (data.organizationRole === "owner" && !isConfirmOwnershipChangeDialogOpen && user.organizationId !== "1") {
				setIsConfirmOwnershipChangeDialogOpen(true);
				return;
			}

			let successfullyUploadedImage = false;

			// If the profile image has changed, upload it
			if ((data.profileImageUrl && !organizationUser) || data.profileImageUrl !== organizationUser?.profileImageUrl) {
				if (uploadedProfileImage) {
					handleProfileImageUpload(uploadedProfileImage)
						.then((url) => {
							data.profileImageUrl = url;
							successfullyUploadedImage = true;
						})
						.catch(() => {
							toast({
								title: "Failed to upload profile image",
								description: "An unknown error occurred while trying to upload the profile image. Please try again.",
							});
						});
				}
			}

			try {
				if (!isNew) {
					if (organizationUser) {
						await updateMutation.mutateAsync({
							...data,
							profileImageUrl:
								data.profileImageUrl != null
									? successfullyUploadedImage
										? data.profileImageUrl
										: organizationUser.profileImageUrl
									: null,
						});
					} else {
						await insertMutation.mutateAsync({
							...data,
							profileImageUrl:
								data.profileImageUrl != null ? (successfullyUploadedImage ? data.profileImageUrl : null) : null,
						});

						onSuccessfulSubmit?.(data);

						setOpen(false);

						toast({
							title: `User ${isNew ? "Created" : "Updated"}`,
							description: `Successfully ${isNew ? "created" : "updated"} user "${data.givenName}${
								data.familyName ? " " + data.familyName : ""
							}".`,
						});
					}
				}
			} catch (error) {
				logInDevelopment(error);

				toast({
					title: `User ${isNew ? "Creation" : "Update"} Failed`,
					description: `There was an error ${isNew ? "creating" : "updating"} user "${data.givenName}${
						data.familyName ? " " + data.familyName : ""
					}". Please try again.`,
					variant: "destructive",
				});
			}
		});
	}

	return (
		<>
			<Dialog open={isConfirmOwnershipChangeDialogOpen} onOpenChange={setIsConfirmOwnershipChangeDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							You are about to change the ownership of this organization. This will remove your ownership of this
							organization and make this user the owner. You will be demoted to an admin.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsConfirmOwnershipChangeDialogOpen(false);
							}}
						>
							Cancel
						</Button>
						<Button variant="destructive" disabled={form.formState.isSubmitting} onClick={_onSubmit}>
							{form.formState.isSubmitting && <Loader size="sm" />}
							<span>Change ownership</span>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Form {...form}>
				<form className="grid gap-4" onSubmit={_onSubmit}>
					<div className="grid gap-2 xl:grid-cols-2">
						<div className="flex w-full flex-1">
							<FormField
								control={form.control}
								name="givenName"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>First name</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="flex w-full flex-1">
							<FormField
								control={form.control}
								name="familyName"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormLabel>Last name</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>

					<FormField
						control={form.control}
						name="emailAddress"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email address</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<AccountProfileImage setUploadedProfileImage={setUploadedProfileImage} />

					{!isNew && <AccountSessions />}

					<FormField
						control={form.control}
						name="organizationRole"
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
										<TabsList className="w-full">
											{organizationRoleOptions.map((option) => {
												if (option === "owner" && user.organizationId !== "1" && user.organizationRole !== "owner") {
													return null;
												}

												return (
													<TabsTrigger key={option} value={option} className="flex-1 capitalize">
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
						{!isNew &&
							onDelete &&
							organizationUser?.organizationRole !== "owner" &&
							(user.organizationRole === "owner" || organizationUser?.organizationRole === "member") && (
								<DestructiveActionDialog
									name="user"
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
							{!isNew ? "Update user" : "Create user"}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</>
	);
}

function AccountProfileImage({ setUploadedProfileImage }: { setUploadedProfileImage: (file: File | null) => void }) {
	const { toast } = useToast();
	const form = useFormContext<ManageOrganizationUserFormSchema>();

	const onDrop = React.useCallback(
		(acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
			acceptedFiles.forEach((file) => {
				setUploadedProfileImage(file);

				form.setValue("profileImageUrl", URL.createObjectURL(file), { shouldDirty: true });
			});

			rejectedFiles.forEach((file) => {
				toast({
					title: `Failed to upload file: "${file.file.name}"`,
					description: file.errors
						.map((error) =>
							error.code === "file-invalid-type"
								? "Profile images can only have a file type of JPG/JPEG or PNG."
								: error.code === "too-many-files"
								? "You can only upload one profile image."
								: error.message,
						)
						.join("\n"),
					variant: "destructive",
				});
			});
		},
		[form, toast, setUploadedProfileImage],
	);

	const profileImageUrl = form.watch("profileImageUrl");

	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		onDrop,
		noClick: profileImageUrl ? true : false,
		maxFiles: 1,
		accept: {
			"image/png": [".png"],
			"image/jpeg": [".jpeg", ".jpg"],
		},
		maxSize: 1048576,
	});

	return (
		<div className="grid gap-2">
			<Label>Profile Image</Label>

			<div className="relative flex w-full flex-1" {...getRootProps()}>
				<div className={cn("z-10 w-full bg-white", isDragActive ? "absolute" : "hidden")}>
					<div className="relative block w-full rounded-lg border-2 border-dashed border-slate-300 p-4 text-center hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
						<input {...getInputProps()} />
						<p className="font-semibold">Drop file here </p>
						<p className="mt-1 text-sm text-muted-foreground">JPG and PNG only (max. 4MB) </p>
					</div>
				</div>
				<div className="flex flex-1 space-x-6">
					<div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-gray-100">
						{!profileImageUrl ? (
							<>
								{form.getValues("givenName")?.[0] ?? "D"}
								{form.getValues("familyName")?.[0] ?? "M"}
							</>
						) : (
							<Image
								src={profileImageUrl}
								alt="User's profile image"
								width={256}
								height={256}
								className="aspect-square rounded-md object-cover"
							/>
						)}
					</div>
					<div>
						<div className="flex items-center space-x-3">
							<Button variant="outline" type="button" onClick={open}>
								Choose
							</Button>
							<Button
								variant="ghost"
								type="button"
								size="icon"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									form.setValue("profileImageUrl", undefined, { shouldDirty: true });
									setUploadedProfileImage(null);
								}}
							>
								<TrashIcon className="h-4 w-4" />
							</Button>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">JPG and PNG only (max. 4MB) </p>
					</div>
				</div>
			</div>
		</div>
	);
}

type Sessions = NonNullable<ManageOrganizationFormSchema["organizationUsers"][number]["sessions"]>;

function AccountSessions({ initialSessions = [] }: { initialSessions?: Sessions }) {
	const currentSession = useSession();

	const [sessions, setSessions] = React.useState(initialSessions);

	const activeSession = sessions.find((session) => session.id === currentSession?.id);

	return (
		<div className="space-y-2">
			<div>
				<Label>Sessions</Label>
			</div>
			<div className="">
				<Accordion type="single" collapsible className="w-full">
					{activeSession && (
						<SessionAccordionItem
							session={activeSession}
							isCurrentSession
							onDelete={(session) => {
								setSessions((prev) => prev.filter((s) => s.id !== session.id));
							}}
						/>
					)}

					{sessions.map((session) => {
						const isCurrentSession = currentSession?.id === session.id;

						if (isCurrentSession) {
							return null;
						}

						return (
							<SessionAccordionItem
								key={session.id}
								session={session}
								onDelete={(session) => {
									setSessions((prev) => prev.filter((s) => s.id !== session.id));
								}}
							/>
						);
					})}
				</Accordion>
			</div>
		</div>
	);
}

function SessionAccordionItem({
	session,
	isCurrentSession = false,
	onDelete,
}: {
	session: Sessions[number];
	isCurrentSession?: boolean;
	onDelete: (session: Sessions[number]) => void;
}) {
	const { dayjs } = useDayjs();

	const [isSignOutConfirmDialogOpen, setIsSignOutConfirmDialogOpen] = React.useState(false);
	const [isSigningOut, setIsSigningOut] = React.useState(false);

	const hasCityOrCountry = session.city || session.country;

	const { toast } = useToast();

	const parsedUA = new UAParser(session.userAgent ?? undefined);
	const os = parsedUA.getOS();
	const browser = parsedUA.getBrowser();

	const deleteMutation = api.auth.sessions.delete.useMutation();

	return (
		<AccordionItem value={session.id}>
			<AccordionTrigger>
				<div className="flex space-x-4">
					<div>
						<p className="text-left">
							{os.name}{" "}
							{hasCityOrCountry
								? `(${session.city ?? ""}${session.city && session.country ? ", " : ""}${session.country ?? ""})`
								: ""}
						</p>
						<p className="text-left text-xs text-muted-foreground">
							{session.lastActiveAt ? `${dayjs.tz(session.lastActiveAt).fromNow(true)} ago` : "Never logged in"}
						</p>
					</div>
					<div>{isCurrentSession && <Badge>This Session</Badge>}</div>
				</div>
			</AccordionTrigger>
			<AccordionContent>
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-semibold">Additional Information</p>
						<p className="text-xs text-muted-foreground">
							Browser: {browser.name} v{browser.version}
						</p>
						<p className="text-xs text-muted-foreground">
							{session.ipAddress ? (
								<>
									IP Address: {session.ipAddress}{" "}
									{hasCityOrCountry
										? `(${session.city ?? ""}${session.city && session.country ? ", " : ""}${session.country ?? ""})`
										: ""}
								</>
							) : (
								"IP Address: Unknown"
							)}
						</p>
					</div>
					<div>
						<p className="text-sm font-medium">{isCurrentSession ? "Current session" : "Sign out"}</p>
						<p className="text-xs text-muted-foreground">
							{isCurrentSession
								? "This is the session you are currently using."
								: "Click the button below to sign this session out. "}
						</p>
						{!isCurrentSession && (
							<Dialog open={isSignOutConfirmDialogOpen} onOpenChange={setIsSignOutConfirmDialogOpen}>
								<DialogTrigger asChild>
									<Button variant="link" className="-ml-4 text-destructive">
										Remove this session
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Are you sure?</DialogTitle>
										<DialogDescription>
											You are about to sign this session out. If you believe this is a suspicious login, please and
											contact support.
										</DialogDescription>
									</DialogHeader>
									<DialogFooter>
										<Button variant="outline" onClick={() => setIsSignOutConfirmDialogOpen(false)}>
											Cancel
										</Button>
										<Button
											variant="destructive"
											disabled={isSigningOut}
											onClick={(e) => {
												e.preventDefault();
												setIsSigningOut(true);

												deleteMutation
													.mutateAsync({ id: session.id })
													.then(() => {
														toast({
															title: "Signed out session",
															description: "Successfully signed session/device out.",
														});
														onDelete(session);
														setIsSignOutConfirmDialogOpen(false);
													})
													.catch(() => {
														toast({
															title: "Failed to sign session out",
															description: "An error occurred while signing the session out. Please try again.",
															variant: "destructive",
														});
													})
													.finally(() => {
														setIsSigningOut(false);
													});
											}}
										>
											{isSigningOut && <Loader size="sm" />}
											<span>Sign session out</span>
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						)}
					</div>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}

export { type ManageOrganizationUserDialogProps, type ManageOrganizationUserFormSchema, ManageOrganizationUserDialog };
