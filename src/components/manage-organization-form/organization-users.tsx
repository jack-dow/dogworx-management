"use client";

import * as React from "react";
import Image from "next/image";
import { useFieldArray, useFormContext } from "react-hook-form";

import { ClickToCopy } from "~/components/ui/click-to-copy";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FormGroup, FormSection } from "~/components/ui/form";
import { EditIcon, EllipsisVerticalIcon, EnvelopeIcon, TrashIcon, UserCircleIcon } from "~/components/ui/icons";
import { useUser } from "~/app/providers";
import { useDayjs } from "~/hooks/use-dayjs";
import { sessionJWTExpiry } from "~/lib/auth-options";
import { logInDevelopment } from "~/lib/client-utils";
import { api } from "~/lib/trpc/client";
import { Button } from "../ui/button";
import { Loader } from "../ui/loader";
import { useToast } from "../ui/use-toast";
import { type ManageOrganizationFormSchema } from "./manage-organization-form";
import { ManageOrganizationUserDialog } from "./manage-organization-user-dialog";

function OrganizationUsers({ isNew }: { isNew: boolean }) {
	const { toast } = useToast();
	const user = useUser();

	const form = useFormContext<ManageOrganizationFormSchema>();

	const organizationUsers = useFieldArray({
		control: form.control,
		name: "organizationUsers",
		keyName: "rhf-id",
	});

	const [editingUser, setEditingUser] = React.useState<
		ManageOrganizationFormSchema["organizationUsers"][number] | null
	>(null);
	const [confirmUserDelete, setConfirmUserDelete] = React.useState<string | null>(null);

	const deleteMutation = api.auth.organizations.users.delete.useMutation();

	async function handleUserDelete(userId: string) {
		const user = organizationUsers.fields.find((field) => field.id === userId)!;

		try {
			if (!isNew) {
				await deleteMutation.mutateAsync({
					id: userId,
				});
			}

			organizationUsers.remove(organizationUsers.fields.findIndex((field) => field.id === userId));

			toast({
				title: `User deleted`,
				description: `Successfully deleted user "${user.givenName}${user.familyName ? " " + user.familyName : ""}".`,
			});
		} catch (error) {
			logInDevelopment(error);

			toast({
				title: `User deletion failed`,
				description: `There was an error deleting user "${user.givenName}${
					user.familyName ? " " + user.familyName : ""
				}". Please try again.`,
				variant: "destructive",
			});
		}
	}

	const currentUser = organizationUsers.fields.find((field) => field.id === user.id);

	return (
		<>
			<DestructiveActionDialog
				name="user"
				requiresSaveOf="organization"
				withoutTrigger
				open={!!confirmUserDelete}
				onOpenChange={() => setConfirmUserDelete(null)}
				onConfirm={async () => {
					if (confirmUserDelete) {
						await handleUserDelete(confirmUserDelete);
					}
				}}
			/>

			<FormSection title="Users" description="Manage this organization's users">
				<FormGroup>
					<div className="grid gap-2 sm:col-span-6">
						<ManageOrganizationUserDialog
							withoutTrigger
							open={!!editingUser}
							setOpen={() => setEditingUser(null)}
							organizationUser={editingUser ?? undefined}
							onDelete={async (id) => {
								if (isNew) {
									await handleUserDelete(id);
									return;
								}

								setConfirmUserDelete(id);
							}}
						/>
						<ul role="list" className="divide-y divide-gray-100">
							{currentUser && (
								<OrganizationUserItem
									key={currentUser.id}
									organizationUser={currentUser}
									onDeleteClick={async () => {
										if (isNew) {
											await handleUserDelete(currentUser.id);
											return;
										}

										setConfirmUserDelete(currentUser.id);
									}}
									onEditClick={() => {
										setEditingUser(currentUser);
									}}
								/>
							)}

							{organizationUsers.fields.map((organizationUser) => {
								if (organizationUser.id === user.id) {
									return null;
								}

								return (
									<OrganizationUserItem
										key={organizationUser.id}
										organizationUser={organizationUser}
										onDeleteClick={async () => {
											if (isNew) {
												await handleUserDelete(organizationUser.id);
												return;
											}

											setConfirmUserDelete(organizationUser.id);
										}}
										onEditClick={() => {
											setEditingUser(organizationUser);
										}}
									/>
								);
							})}
						</ul>
						<div className="flex justify-end">
							{form.getValues("maxUsers") > organizationUsers.fields.length ? (
								<ManageOrganizationUserDialog
									onSuccessfulSubmit={(data) => {
										organizationUsers.append(data);
									}}
									defaultValues={
										user.organizationId === "1"
											? {
													organizationId: form.getValues("id"),
											  }
											: undefined
									}
								/>
							) : (
								<Button
									onClick={() => {
										toast({
											title: `Max users reached`,
											description: `Please upgrade your plan to add more users. If you need any assistance, please contact support.
										`,
											variant: "destructive",
										});
									}}
								>
									Create user
								</Button>
							)}
						</div>
					</div>
				</FormGroup>
			</FormSection>
		</>
	);
}

function OrganizationUserItem({
	organizationUser,
	onDeleteClick,
	onEditClick,
}: {
	organizationUser: ManageOrganizationFormSchema["organizationUsers"][number];
	onDeleteClick: () => Promise<void>;
	onEditClick: () => void;
}) {
	const { dayjs } = useDayjs();

	const user = useUser();

	const [isDeleting, setIsDeleting] = React.useState(false);
	return (
		<li className="relative flex justify-between gap-x-6 py-5">
			<div className="flex shrink items-center gap-x-2 truncate">
				<div className="hidden h-12 w-12 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
					{organizationUser.profileImageUrl ? (
						<Image
							src={organizationUser.profileImageUrl}
							alt="User's profile image"
							width={128}
							height={128}
							className="aspect-square h-10 w-10 rounded-full object-cover"
						/>
					) : (
						<>
							<UserCircleIcon className="h-6 w-6" />
						</>
					)}
				</div>

				<div className="min-w-0 flex-auto">
					<p className="px-2 text-sm font-semibold leading-6 text-primary">
						{organizationUser.givenName} {organizationUser.familyName}
					</p>
					<div className="mt-1 flex flex-col gap-y-2 truncate px-2 md:flex-row md:items-center md:space-x-2 md:pt-0">
						{organizationUser.emailAddress && (
							<ClickToCopy text={organizationUser.emailAddress}>
								<EnvelopeIcon className="mr-1 h-3 w-3" />
								<span className="truncate">{organizationUser.emailAddress}</span>
							</ClickToCopy>
						)}
						{/* {user.emailAddress && user.phoneNumber && (
													<span
														aria-hidden="true"
														className={cn("hidden", variant === "sheet" ? "xl:inline" : "md:inline")}
													>
														&middot;
													</span>
												)}
												{user.phoneNumber && (
													<ClickToCopy text={user.phoneNumber}>
														<PhoneIcon className="mr-1 h-3 w-3" />
														<span className="truncate">{user.phoneNumber}</span>
													</ClickToCopy>
												)} */}
					</div>
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-x-6">
				<div className="hidden sm:flex sm:flex-col sm:items-end">
					<p className="text-sm capitalize leading-6 text-primary">{organizationUser.organizationRole}</p>
					{organizationUser.sessions?.[0] ? (
						<>
							{dayjs
								.tz(organizationUser.sessions[0].lastActiveAt)
								.isAfter(dayjs.tz().subtract(sessionJWTExpiry, "seconds")) ? (
								<div className="mt-1 flex items-center gap-x-1.5">
									<div className="flex-none rounded-full bg-emerald-500/20 p-1">
										<div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
									</div>
									<p className="text-xs leading-5 text-muted-foreground">Online</p>
								</div>
							) : (
								<p className="mt-1 text-xs leading-5 text-muted-foreground">
									Last seen{" "}
									<time dateTime={dayjs.tz(organizationUser.sessions[0].lastActiveAt).toISOString()}>
										{dayjs.tz(organizationUser.sessions[0].lastActiveAt).fromNow()}
									</time>
								</p>
							)}
						</>
					) : (
						<p className="mt-1 text-xs leading-5 text-muted-foreground">Never logged in</p>
					)}
				</div>
				{organizationUser.id !== user.id && user.organizationRole !== "member" && (
					<DropdownMenu>
						<DropdownMenuTrigger className="flex items-center rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
							<span className="sr-only">Open options</span>
							<EllipsisVerticalIcon className="h-5 w-5" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onSelect={() => {
									onEditClick();
								}}
							>
								<EditIcon className="mr-2 h-4 w-4" />
								<span className="flex-1">Edit</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => {
									setIsDeleting(true);
									void onDeleteClick().finally(() => {
										setIsDeleting(false);
									});
								}}
							>
								<TrashIcon className="mr-2 h-4 w-4" />
								<span className="flex-1">Remove</span>
								{isDeleting && <Loader size="sm" variant="black" className="ml-2 mr-0" />}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</li>
	);
}

export { OrganizationUsers };
