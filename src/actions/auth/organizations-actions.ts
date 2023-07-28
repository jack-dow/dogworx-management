"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { organizationInviteLinks, organizations } from "~/db/schemas";
import { InsertOrganizationSchema, UpdateOrganizationSchema } from "~/db/validation";
import { createServerAction, SearchTermSchema, separateActionsLogSchema, type ExtractServerActionData } from "../utils";

const listOrganizations = createServerAction(async (limit?: number) => {
	try {
		const data = await drizzle.query.organizations.findMany({
			limit: limit ?? 50,
			orderBy: (organizations, { asc }) => [asc(organizations.name)],
			with: {
				users: true,
				organizationInviteLinks: {
					with: {
						user: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to list organizations" };
	}
});
type OrganizationsList = ExtractServerActionData<typeof listOrganizations>;

const searchOrganizations = createServerAction(async (searchTerm: string) => {
	const validSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!validSearchTerm.success) {
		return { success: false, error: validSearchTerm.error.issues };
	}

	try {
		const data = await drizzle.query.organizations.findMany({
			where: eq(organizations.name, validSearchTerm.data),
			limit: 50,
			with: {
				users: true,
				organizationInviteLinks: {
					with: {
						user: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to search organizations" };
	}
});
type OrganizationsSearch = ExtractServerActionData<typeof searchOrganizations>;

const getOrganizationInviteLinkById = createServerAction(async (id: string) => {
	const validInviteLink = z.string().safeParse(id);

	if (!validInviteLink.success) {
		return { success: false, error: validInviteLink.error.issues };
	}

	try {
		const data = await drizzle.query.organizationInviteLinks.findFirst({
			where: sql`BINARY ${organizationInviteLinks.id} = ${validInviteLink.data}`,
			with: {
				organization: true,
			},
		});

		return { success: true, data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to get organization by invite link" };
	}
});
type OrganizationInviteLinkById = ExtractServerActionData<typeof getOrganizationInviteLinkById>;

const insertOrganization = createServerAction(async (values: InsertOrganizationSchema) => {
	const validValues = InsertOrganizationSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const { actions, ...data } = validValues.data;

		const organizationInviteLinksActionsLog = separateActionsLogSchema(actions.organizationInviteLinks, data.id);

		await drizzle.transaction(async (trx) => {
			await trx.insert(organizations).values(data);

			if (organizationInviteLinksActionsLog.inserts.length > 0) {
				await trx.insert(organizationInviteLinks).values(organizationInviteLinksActionsLog.inserts);
			}
		});

		revalidatePath("/organizations");

		const organization = await drizzle.query.organizations.findFirst({
			where: eq(organizations.id, data.id),
			with: {
				users: true,
				organizationInviteLinks: {
					with: {
						user: true,
					},
				},
			},
		});

		return { success: true, data: organization };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to insert organization" };
	}
});
type OrganizationInsert = ExtractServerActionData<typeof insertOrganization>;

const updateOrganization = createServerAction(async (values: UpdateOrganizationSchema) => {
	const validValues = UpdateOrganizationSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const { id, actions, ...data } = validValues.data;

		const organizationInviteLinksActionsLog = separateActionsLogSchema(actions?.organizationInviteLinks ?? {}, id);

		await drizzle.transaction(async (trx) => {
			await trx.update(organizations).set(data).where(eq(organizations.id, id));

			if (organizationInviteLinksActionsLog.inserts.length > 0) {
				await trx.insert(organizationInviteLinks).values(organizationInviteLinksActionsLog.inserts);
			}

			if (organizationInviteLinksActionsLog.updates.length > 0) {
				for (const inviteLink of organizationInviteLinksActionsLog.updates) {
					await trx
						.update(organizationInviteLinks)
						.set(inviteLink)
						.where(eq(organizationInviteLinks.id, inviteLink.id));
				}
			}

			if (organizationInviteLinksActionsLog.deletes.length > 0) {
				await trx
					.delete(organizationInviteLinks)
					.where(inArray(organizationInviteLinks.id, organizationInviteLinksActionsLog.deletes));
			}
		});

		revalidatePath("/organizations");

		const organization = await drizzle.query.organizations.findFirst({
			where: eq(organizations.id, id),
			with: {
				users: true,
				organizationInviteLinks: {
					with: {
						user: true,
					},
				},
			},
		});

		return { success: true, data: organization };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to update organization" };
	}
});
type OrganizationUpdate = ExtractServerActionData<typeof updateOrganization>;

const deleteOrganization = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues };
	}

	try {
		const organization = await drizzle.query.organizations.findFirst({
			where: eq(organizations.id, validId.data),
			columns: {
				id: true,
			},
			with: {
				users: true,
				organizationInviteLinks: {
					with: {
						user: true,
					},
				},
			},
		});

		if (organization) {
			await drizzle.transaction(async (trx) => {
				await trx.delete(organizations).where(eq(organizations.id, id));

				if (organization.organizationInviteLinks.length > 0) {
					await trx.delete(organizationInviteLinks).where(
						inArray(
							organizationInviteLinks.id,
							organization.organizationInviteLinks.map((c) => c.id),
						),
					);
				}
			});
		}

		revalidatePath("/organizations");

		return { success: true, data: validId.data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to delete organization" };
	}
});
type OrganizationDelete = ExtractServerActionData<typeof deleteOrganization>;

export {
	listOrganizations,
	type OrganizationsList,
	searchOrganizations,
	getOrganizationInviteLinkById,
	type OrganizationInviteLinkById,
	type OrganizationsSearch,
	insertOrganization,
	type OrganizationInsert,
	updateOrganization,
	type OrganizationUpdate,
	deleteOrganization,
	type OrganizationDelete,
};
