"use client";

import * as React from "react";
import { init } from "@paralleldrive/cuid2";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
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
import { EditIcon, EllipsisVerticalIcon, TrashIcon } from "~/components/ui/icons";
import { useUser } from "~/app/(dashboard)/providers";
import { type ManageOrganizationFormSchema } from "./use-manage-organization-form";

dayjs.extend(relativeTime);

const createInviteLinkCode = init({
	length: 8,
});

function OrganizationInviteLinks({
	existingInviteLinks,
	variant,
}: {
	existingInviteLinks: ManageOrganizationFormSchema["organizationInviteLinks"];
	variant: "sheet" | "form";
}) {
	const user = useUser();
	const form = useFormContext<ManageOrganizationFormSchema>();
	const organizationInviteLinks = useFieldArray({
		control: form.control,
		name: "organizationInviteLinks",
		keyName: "rhf-id",
	});

	const [confirmInviteLinkDelete, setConfirmInviteLinkDelete] = React.useState<
		ManageOrganizationFormSchema["organizationInviteLinks"][number] | null
	>(null);

	function handleInviteLinkDelete(inviteLinkId: string) {
		organizationInviteLinks.remove(
			organizationInviteLinks.fields.findIndex((inviteLink) => inviteLink.id === inviteLinkId),
		);

		form.setValue("actions.organizationInviteLinks", {
			...form.getValues("actions.organizationInviteLinks"),
			[inviteLinkId]: {
				type: "DELETE",
				payload: inviteLinkId,
			},
		});
	}

	const SectionWrapper = variant === "sheet" ? FormSheetGroup : FormSection;
	const FieldsWrapper = variant === "sheet" ? React.Fragment : FormGroup;

	return (
		<>
			<DestructiveActionDialog
				name="invite link"
				requiresSaveOf="organization"
				withoutTrigger
				open={!!confirmInviteLinkDelete}
				onOpenChange={() => setConfirmInviteLinkDelete(null)}
				onConfirm={() => {
					if (confirmInviteLinkDelete) {
						handleInviteLinkDelete(confirmInviteLinkDelete.id);
					}
				}}
			/>

			<SectionWrapper title="Invite Links" description="Manage this organization's invite links">
				<FieldsWrapper>
					<div className="sm:col-span-6">
						<div className="mb-1 grid grid-cols-8">
							<div className="col-span-2">
								<p className="truncate text-sm font-semibold">Inviter</p>
							</div>
							<div className="col-span-2 flex items-center justify-center">
								<p className="truncate text-sm font-semibold">Invite Code</p>
							</div>
							<div className="col-span-1 flex items-center justify-center">
								<p className="truncate text-sm font-semibold">Uses</p>
							</div>
							<div className="col-span-2 flex items-center justify-center">
								<p className="truncate text-sm font-semibold">Expires</p>
							</div>
							<div className="col-span-1" />
						</div>
						<ul role="list" className="divide-y divide-slate-100">
							{organizationInviteLinks.fields.map((inviteLink) => (
								<li key={inviteLink.id} className="grid grid-cols-8 py-4">
									<div className="col-span-2">
										<p className="truncate text-sm">
											{inviteLink.user.givenName} {inviteLink.user.familyName}
										</p>
									</div>

									<div className="col-span-2 flex items-center justify-center">
										<p className="truncate text-sm">{inviteLink.id}</p>
									</div>

									<div className="col-span-1 flex items-center justify-center">
										<p className="truncate text-sm">{inviteLink.uses}</p>
									</div>

									<div className="col-span-2 flex items-center justify-center capitalize">
										<p className="truncate text-sm">{dayjs(inviteLink.expiresAt).fromNow()}</p>
									</div>

									<div className="col-span-1 flex items-center justify-end space-x-4">
										<div className="flex items-center">
											<DropdownMenu>
												<DropdownMenuTrigger className="flex items-center rounded-full text-slate-400 hover:text-slate-600  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
													<span className="sr-only">Open options</span>
													<EllipsisVerticalIcon className="h-5 w-5" />
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuSeparator />

													<DropdownMenuItem>
														<EditIcon className="mr-2 h-4 w-4" />
														Edit
													</DropdownMenuItem>
													<DropdownMenuItem
														onSelect={() => {
															if (existingInviteLinks.find((link) => link.id === inviteLink.id)) {
																setConfirmInviteLinkDelete(inviteLink);
															} else {
																handleInviteLinkDelete(inviteLink.id);
															}
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
						<div className="pt-4">
							<Button
								type="button"
								size="sm"
								disabled={organizationInviteLinks.fields.length >= 10}
								onClick={() => {
									const inviteLink = {
										id: createInviteLinkCode(),
										uses: 0,
										expiresAt: dayjs().add(1, "week").toDate(),
										userId: user.id,
										organizationId: form.getValues("id"),
										user,
										role: "member",
										maxUses: 5,
									} as const;

									organizationInviteLinks.append(inviteLink);

									form.setValue("actions.organizationInviteLinks", {
										...form.getValues("actions.organizationInviteLinks"),
										[inviteLink.id]: {
											type: "INSERT",
											payload: inviteLink,
										},
									});
								}}
							>
								Generate Invite Link
							</Button>
						</div>
					</div>
				</FieldsWrapper>
			</SectionWrapper>
		</>
	);
}

export { OrganizationInviteLinks };
