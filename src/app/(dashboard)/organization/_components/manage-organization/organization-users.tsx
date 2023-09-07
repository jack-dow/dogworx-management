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
import { FormGroup, FormSection, FormSheetGroup } from "~/components/ui/form";
import { EllipsisVerticalIcon, EnvelopeIcon, TrashIcon, UserCircleIcon } from "~/components/ui/icons";
import { cn } from "~/utils";
import { type ManageOrganizationFormSchema } from "./use-manage-organization-form";

function OrganizationUsers({
	existingUsers,
	variant,
}: {
	existingUsers: ManageOrganizationFormSchema["users"];
	variant: "sheet" | "form";
}) {
	const form = useFormContext<ManageOrganizationFormSchema>();
	const users = useFieldArray({
		control: form.control,
		name: "users",
		keyName: "rhf-id",
	});

	const [confirmUserDelete, setConfirmUserDelete] = React.useState<
		ManageOrganizationFormSchema["users"][number] | null
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

	const SectionWrapper = variant === "sheet" ? FormSheetGroup : FormSection;
	const FieldsWrapper = variant === "sheet" ? React.Fragment : FormGroup;

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

			<SectionWrapper title="Users" description="Manage this organization's users">
				<FieldsWrapper>
					<div className="sm:col-span-6">
						<ul role="list" className="divide-y divide-slate-100">
							{users.fields.map((user, index) => (
								<li
									key={user.id}
									className={cn("flex items-center justify-between gap-x-6", index === 0 ? "pb-4" : "py-4")}
								>
									<div className="flex shrink items-center gap-x-2 truncate">
										<div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50 sm:flex">
											{user.profileImageUrl ? (
												<Image
													src={user.profileImageUrl}
													alt="User's profile image"
													width={128}
													height={128}
													className="aspect-square h-8 w-8 rounded-full object-cover"
												/>
											) : (
												<>
													<UserCircleIcon className="h-5 w-5" />
												</>
											)}
										</div>

										<div className="min-w-0 flex-auto ">
											<p className="px-2 text-sm font-semibold leading-6 text-primary">
												{user.givenName} {user.familyName}
											</p>
											<div
												className={cn(
													"flex flex-col gap-y-2 truncate px-2 pt-1",
													variant === "sheet"
														? " xl:flex-row xl:items-center xl:space-x-2 xl:pt-0"
														: " md:flex-row md:items-center md:space-x-2 md:pt-0",
												)}
											>
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

									<div className="flex space-x-4">
										<div className="flex items-center">
											<DropdownMenu>
												<DropdownMenuTrigger className="flex items-center rounded-full text-slate-400 hover:text-slate-600  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
													<span className="sr-only">Open options</span>
													<EllipsisVerticalIcon className="h-5 w-5" />
												</DropdownMenuTrigger>
												<DropdownMenuContent withoutPortal={variant === "sheet"} align="end">
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
									</div>
								</li>
							))}
						</ul>
					</div>
				</FieldsWrapper>
			</SectionWrapper>
		</>
	);
}

export { OrganizationUsers };
