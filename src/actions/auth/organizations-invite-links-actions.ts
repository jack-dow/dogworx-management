"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { organizationInviteLinks } from "~/db/schema";
import { InsertOrganizationInviteLinkSchema, UpdateOrganizationInviteLinkSchema } from "~/db/validation";
import { createServerAction, getServerUser, type ExtractServerActionData } from "../utils";

const getOrganizationInviteLinkById = createServerAction(async (id: string) => {
	const validInviteLink = z.string().safeParse(id);

	if (!validInviteLink.success) {
		return { success: false, error: validInviteLink.error.issues, data: null };
	}

	try {
		const data = await drizzle.query.organizationInviteLinks.findFirst({
			where: sql`BINARY ${organizationInviteLinks.id} = ${validInviteLink.data}`,
			with: {
				organization: true,
			},
		});

		return { success: true, data };
	} catch {
		return { success: false, error: "Failed to get organization by invite link", data: null };
	}
});
type OrganizationInviteLinkById = ExtractServerActionData<typeof getOrganizationInviteLinkById>;

const insertOrganizationInviteLink = createServerAction(async (data: InsertOrganizationInviteLinkSchema) => {
	const validation = InsertOrganizationInviteLinkSchema.safeParse(data);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (user.organizationRole !== "owner" && user.organizationRole !== "admin") {
			return {
				success: false,
				error: "You are not authorized to create invite links for your organization.",
				data: null,
			};
		}

		await drizzle.insert(organizationInviteLinks).values({
			...validation.data,
			organizationId: user.organizationId !== "1" ? user.organizationId : validation.data.organizationId,
		});

		revalidatePath("/settings/organization");
		revalidatePath("/organizations/[id]");

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: "Failed to insert organization invite link", data: null };
	}
});
type OrganizationInviteLinkInsert = ExtractServerActionData<typeof insertOrganizationInviteLink>;

const updateOrganizationInviteLink = createServerAction(async (data: UpdateOrganizationInviteLinkSchema) => {
	const validation = UpdateOrganizationInviteLinkSchema.safeParse(data);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (user.organizationRole !== "owner" && user.organizationRole !== "admin") {
			return {
				success: false,
				error: "You are not authorized to update invite links for your organization.",
				data: null,
			};
		}

		const { id, ...data } = validation.data;

		await drizzle
			.update(organizationInviteLinks)
			.set(data)
			.where(
				and(
					user.organizationId !== "1" ? eq(organizationInviteLinks.organizationId, user.organizationId) : undefined,
					eq(organizationInviteLinks.id, id),
				),
			);

		revalidatePath("/settings/organization");
		revalidatePath("/organizations/[id]");

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: "Failed to update organization invite links", data: null };
	}
});
type OrganizationInviteLinkUpdate = ExtractServerActionData<typeof updateOrganizationInviteLink>;

const deleteOrganizationInviteLink = createServerAction(async (id: string) => {
	const validation = z.string().safeParse(id);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (user.organizationRole !== "owner" && user.organizationRole !== "admin") {
			return {
				success: false,
				error: "You are not authorized to delete invite links for your organization.",
				data: null,
			};
		}

		await drizzle
			.delete(organizationInviteLinks)
			.where(
				and(
					user.organizationId !== "1" ? eq(organizationInviteLinks.organizationId, user.organizationId) : undefined,
					eq(organizationInviteLinks.id, id),
				),
			);

		revalidatePath("/settings/organization");
		revalidatePath("/organizations/[id]");

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: "Failed to delete organization invite links", data: null };
	}
});
type OrganizationInviteLinkDelete = ExtractServerActionData<typeof deleteOrganizationInviteLink>;

export {
	getOrganizationInviteLinkById,
	type OrganizationInviteLinkById,
	insertOrganizationInviteLink,
	type OrganizationInviteLinkInsert,
	updateOrganizationInviteLink,
	type OrganizationInviteLinkUpdate,
	deleteOrganizationInviteLink,
	type OrganizationInviteLinkDelete,
};
