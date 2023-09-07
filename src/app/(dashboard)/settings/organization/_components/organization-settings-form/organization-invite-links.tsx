"use client";

import * as React from "react";
import { init } from "@paralleldrive/cuid2";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
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
import { EditIcon, EllipsisVerticalIcon, TrashIcon } from "~/components/ui/icons";
import { useUser } from "~/app/providers";
import { useDayjs } from "~/hooks/use-dayjs";
import { getBaseUrl } from "~/utils";
import { ManageOrganizationInviteLinkDialog } from "../manage-organization-invite-link-dialog";
import { type OrganizationSettingsFormSchema } from "./organization-settings-form";

const createInviteLinkCode = init({
	length: 8,
});

const people = [
	{ name: "Lindsay Walton", title: "Front-end Developer", email: "lindsay.walton@example.com", role: "Member" },
	{ name: "Lindsay Walton", title: "Front-end Developer", email: "lindsay.walton@example.com", role: "Member" },
	{ name: "Lindsay Walton", title: "Front-end Developer", email: "lindsay.walton@example.com", role: "Member" },
	{ name: "Lindsay Walton", title: "Front-end Developer", email: "lindsay.walton@example.com", role: "Member" },
];

function OrganizationInviteLinks({
	existingInviteLinks,
}: {
	existingInviteLinks: OrganizationSettingsFormSchema["organizationInviteLinks"];
}) {
	const { dayjs } = useDayjs();
	const user = useUser();
	const form = useFormContext<OrganizationSettingsFormSchema>();
	const organizationInviteLinks = useFieldArray({
		control: form.control,
		name: "organizationInviteLinks",
		keyName: "rhf-id",
	});

	const [confirmInviteLinkDelete, setConfirmInviteLinkDelete] = React.useState<
		OrganizationSettingsFormSchema["organizationInviteLinks"][number] | null
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

			<FormSection title="Invite Links" description="Manage this organization's invite links">
				<FormGroup>
					<div className="sm:col-span-6">
						<div className="-mx-4 sm:-mx-0">
							<table className="min-w-full divide-y divide-border">
								<thead>
									<tr>
										<th scope="col" className="pb-3.5 pl-4 pr-3 text-left text-sm font-semibold text-primary sm:pl-0">
											Created by
										</th>
										<th scope="col" className="px-3 pb-3.5 text-left text-sm font-semibold text-primary">
											Code
										</th>
										<th
											scope="col"
											className="hidden px-3 pb-3.5 text-left text-sm font-semibold text-primary sm:table-cell"
										>
											Uses
										</th>
										<th scope="col" className="px-3 pb-3.5 text-left text-sm font-semibold text-primary">
											Role
										</th>
										<th scope="col" className="relative pb-3.5 pl-3 pr-4 sm:pr-0">
											<span className="sr-only">Edit</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 bg-white">
									{organizationInviteLinks.fields.map((inviteLink) => (
										<tr key={inviteLink.id}>
											<td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium sm:w-auto sm:max-w-none sm:pl-0">
												{inviteLink.user.givenName} {inviteLink.user.familyName}
												<dl className="font-normal sm:hidden">
													<dt className="sr-only">Uses</dt>
													<dd className="mt-1 truncate">
														{inviteLink.uses}
														{inviteLink.maxUses ? `/${inviteLink.maxUses}` : null} uses
													</dd>
												</dl>
											</td>
											<td className="px-3 py-4 text-sm ">
												<ClickToCopy
													text={`${getBaseUrl({ absolute: true })}/invite/${inviteLink.id}`}
													className="text-sm"
												>
													{inviteLink.id}
												</ClickToCopy>
											</td>
											<td className="hidden px-3 py-4 text-sm sm:table-cell">
												{inviteLink.uses}
												{inviteLink.maxUses ? `/${inviteLink.maxUses}` : null}
											</td>
											<td className="px-3 py-4 text-sm capitalize">{inviteLink.role}</td>
											<td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
												<a href="#" className="text-indigo-600 hover:text-indigo-900">
													Edit<span className="sr-only">code {inviteLink.id}</span>
												</a>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<ManageOrganizationInviteLinkDialog
							onSubmit={async (data) => {
								console.log(data);
							}}
							onDelete={(id) => {
								console.log(id);
							}}
						/>
					</div>
				</FormGroup>
			</FormSection>
		</>
	);
}

export { OrganizationInviteLinks };
