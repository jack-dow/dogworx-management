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
import { EllipsisVerticalIcon, EnvelopeIcon, TrashIcon, UserCircleIcon } from "~/components/ui/icons";
import { useDayjs } from "~/hooks/use-dayjs";
import { ManageOrganizationUserDialog } from "../manage-organization-user-dialog";
import { type OrganizationSettingsFormSchema } from "./organization-settings-form";

function OrganizationUsers({ existingUsers }: { existingUsers: OrganizationSettingsFormSchema["users"] }) {
	const { dayjs } = useDayjs();

	const form = useFormContext<OrganizationSettingsFormSchema>();

	const users = useFieldArray({
		control: form.control,
		name: "users",
		keyName: "rhf-id",
	});

	const [confirmUserDelete, setConfirmUserDelete] = React.useState<
		OrganizationSettingsFormSchema["users"][number] | null
	>(null);

	function handleUserDelete(userId: string) {
		const usersActions = { ...form.getValues("actions.users") };

		users.remove(users.fields.findIndex((field) => field.id === userId));

		if (usersActions[userId]?.type === "INSERT") {
			delete usersActions[userId];
		} else {
			usersActions[userId] = {
				type: "DELETE",
				payload: userId,
			};
		}

		form.setValue("actions.users", usersActions);
	}

	return (
		<>
			<DestructiveActionDialog
				name="user"
				requiresSaveOf="organization"
				withoutTrigger
				open={!!confirmUserDelete}
				onOpenChange={() => setConfirmUserDelete(null)}
				onConfirm={() => {
					if (confirmUserDelete) {
						handleUserDelete(confirmUserDelete.id);
					}
				}}
			/>

			<FormSection title="Users" description="Manage this organization's users">
				<FormGroup>
					<div className="grid gap-2 sm:col-span-6">
						<ul role="list" className="divide-y divide-gray-100">
							{users.fields.map((user) => (
								<li key={user.id} className="relative flex justify-between gap-x-6 py-5">
									<div className="flex shrink items-center gap-x-2 truncate">
										<div className="hidden h-12 w-12 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
											{user.profileImageUrl ? (
												<Image
													src={user.profileImageUrl}
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
												{user.givenName} {user.familyName}
											</p>
											<div className="mt-1 flex flex-col gap-y-2 truncate px-2 md:flex-row md:items-center md:space-x-2 md:pt-0">
												{user.emailAddress && (
													<ClickToCopy text={user.emailAddress}>
														<EnvelopeIcon className="mr-1 h-3 w-3" />
														<span className="truncate">{user.emailAddress}</span>
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
											<p className="text-sm capitalize leading-6 text-primary">{user.organizationRole}</p>
											{user.sessions?.[0] ? (
												<>
													{dayjs.tz(user.sessions[0].updatedAt).isAfter(dayjs.tz().subtract(15, "minutes")) ? (
														<div className="mt-1 flex items-center gap-x-1.5">
															<div className="flex-none rounded-full bg-emerald-500/20 p-1">
																<div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
															</div>
															<p className="text-xs leading-5 text-muted-foreground">Online</p>
														</div>
													) : (
														<p className="mt-1 text-xs leading-5 text-muted-foreground">
															Last seen{" "}
															<time dateTime={dayjs.tz(user.sessions[0].updatedAt).toISOString()}>
																{dayjs.tz(user.sessions[0].updatedAt).fromNow()}
															</time>
														</p>
													)}
												</>
											) : (
												<p className="mt-1 text-xs leading-5 text-muted-foreground">Never logged in</p>
											)}
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger className="flex items-center rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
												<span className="sr-only">Open options</span>
												<EllipsisVerticalIcon className="h-5 w-5" />
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuSeparator />
												{/* <DropdownMenuItem
														onSelect={(e) => {
															e.preventDefault();
															const renderErrorToast = () => {
																toast({
																	title: "Failed to fetch vet",
																	description: "Something went wrong while fetching the vet. Please try again.",
																	variant: "destructive",
																});
															};

															setIsFetchingVet(true);

															actions.app.vets
																.byId(user.id)
																.then((result) => {
																	if (result.success && result.data) {
																		onEdit(result.data);
																		return;
																	}

																	renderErrorToast();
																})
																.catch(() => {
																	renderErrorToast();
																})
																.finally(() => {
																	setIsFetchingVet(false);
																});
														}}
													>
														<EditIcon className="mr-2 h-4 w-4" />
														<span className="flex-1">Edit</span>
														{isFetchingVet && <Loader size="sm" variant="black" className="ml-2 mr-0" />}
													</DropdownMenuItem> */}
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault();

														if (existingUsers.find((u) => u.id === user.id)) {
															setConfirmUserDelete(user);
															return;
														}

														handleUserDelete(user.id);
													}}
												>
													<TrashIcon className="mr-2 h-4 w-4" />
													<span>Remove</span>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</li>
							))}
						</ul>
						{form.getValues("maxUsers") > users.fields.length && (
							<div className="flex justify-end">
								<ManageOrganizationUserDialog />
							</div>
						)}
					</div>
				</FormGroup>
			</FormSection>
		</>
	);
}

export { OrganizationUsers };
