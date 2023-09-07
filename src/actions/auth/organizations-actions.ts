"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray, like, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import {
	bookings,
	bookingTypes,
	clients,
	dogs,
	dogToClientRelationships,
	dogToVetRelationships,
	organizationInviteLinks,
	organizations,
	users,
	vetClinics,
	vets,
	vetToVetClinicRelationships,
} from "~/db/schema";
import { InsertOrganizationSchema, UpdateOrganizationSchema } from "~/db/validation";
import { ORGANIZATIONS_SORTABLE_COLUMNS } from "../sortable-columns";
import {
	createServerAction,
	getServerUser,
	SearchTermSchema,
	separateActionsLogSchema,
	validatePaginationSearchParams,
	type ExtractServerActionData,
	type PaginationSearchParams,
} from "../utils";

const listOrganizations = createServerAction(async (options: PaginationSearchParams) => {
	try {
		const user = await getServerUser();

		if (user.emailAddress !== "jack.dowww@gmail.com") {
			return {
				success: false,
				error: "You are not authorized to view this page",
				data: {
					pagination: {
						count: 0,
						page: 1,
						maxPage: 1,
						limit: 20,
						sortBy: "id",
						sortDirection: "asc",
					},
					data: [],
				},
			};
		}

		const countQuery = await drizzle
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(organizations);

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...options,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: ORGANIZATIONS_SORTABLE_COLUMNS,
		});

		const data = await drizzle.query.organizations.findMany({
			columns: {
				id: true,
				name: true,
				maxUsers: true,
			},
			limit: limit ?? 50,
			orderBy: (organizations, { asc }) => (orderBy ? [...orderBy, asc(organizations.id)] : [asc(organizations.id)]),
			with: {
				users: {
					columns: {
						id: true,
					},
				},
			},
		});

		return {
			success: true,
			data: {
				pagination: {
					count,
					page,
					maxPage,
					limit,
					sortBy,
					sortDirection,
				},
				data,
			},
		};
	} catch {
		return {
			success: false,
			error: "Failed to list organizations",
			data: {
				pagination: {
					count: 0,
					page: 1,
					maxPage: 1,
					limit: 20,
					sortBy: "id",
					sortDirection: "asc",
				},
				data: [],
			},
		};
	}
});
type OrganizationsList = ExtractServerActionData<typeof listOrganizations>;

const searchOrganizations = createServerAction(async (searchTerm: string) => {
	const validSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!validSearchTerm.success) {
		return { success: false, error: validSearchTerm.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (user.emailAddress !== "jack.dowww@gmail.com") {
			return { success: false, error: "You are not authorized to view this page", data: null };
		}

		const data = await drizzle.query.organizations.findMany({
			where: like(organizations.name, `%${validSearchTerm.data}%`),
			limit: 50,
			orderBy: (organizations, { asc }) => [asc(organizations.name), asc(organizations.id)],
		});

		return { success: true, data };
	} catch {
		return { success: false, error: "Failed to search organizations", data: null };
	}
});
type OrganizationsSearch = ExtractServerActionData<typeof searchOrganizations>;

const getOrganizationById = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (user.emailAddress !== "jack.dowww@gmail.com") {
			return { success: false, error: "You are not authorized to view this page", data: null };
		}

		const data = await drizzle.query.organizations.findFirst({
			where: eq(organizations.id, validId.data),
			with: {
				organizationInviteLinks: {
					with: {
						user: {
							columns: {
								id: true,
								givenName: true,
								familyName: true,
								emailAddress: true,
								organizationRole: true,
								profileImageUrl: true,
							},
						},
					},
				},
				users: {
					columns: {
						id: true,
						givenName: true,
						familyName: true,
						emailAddress: true,
						organizationRole: true,
						profileImageUrl: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch {
		return { success: false, error: `Failed to get organization with id ${validId.data}`, data: null };
	}
});
type OrganizationById = ExtractServerActionData<typeof getOrganizationById>;

const getCurrentOrganization = createServerAction(async () => {
	try {
		const user = await getServerUser();

		const data = await drizzle.query.organizations.findFirst({
			where: eq(organizations.id, user.organizationId),
			with: {
				organizationInviteLinks: {
					with: {
						user: {
							columns: {
								id: true,
								givenName: true,
								familyName: true,
								emailAddress: true,
								organizationRole: true,
								profileImageUrl: true,
							},
						},
					},
				},
				users: {
					columns: {
						id: true,
						givenName: true,
						familyName: true,
						emailAddress: true,
						organizationRole: true,
						profileImageUrl: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		return { success: false, error: `Failed to get the users current organization`, data: null };
	}
});
type CurrentOrganization = ExtractServerActionData<typeof getCurrentOrganization>;

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

const insertOrganization = createServerAction(async (values: InsertOrganizationSchema) => {
	const validValues = InsertOrganizationSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (user.emailAddress !== "jack.dowww@gmail.com") {
			return { success: false, error: "You are not authorized to view this page", data: null };
		}

		const { actions, ...data } = validValues.data;

		const organizationInviteLinksActionsLog = separateActionsLogSchema(actions.organizationInviteLinks, data.id);
		const usersActionsLog = separateActionsLogSchema(actions.users, data.id);

		await drizzle.transaction(async (trx) => {
			await trx.insert(organizations).values(data);

			if (organizationInviteLinksActionsLog.inserts.length > 0) {
				await trx.insert(organizationInviteLinks).values(organizationInviteLinksActionsLog.inserts);
			}

			if (usersActionsLog.inserts.length > 0) {
				await trx.insert(users).values(usersActionsLog.inserts);
			}
		});

		revalidatePath("/organizations");

		const organization = await drizzle.query.organizations.findFirst({
			where: eq(organizations.id, data.id),
			with: {
				users: true,
				organizationInviteLinks: {
					with: {
						user: {
							columns: {
								id: true,
								givenName: true,
								familyName: true,
								emailAddress: true,
								organizationRole: true,
								profileImageUrl: true,
							},
						},
					},
				},
			},
		});

		return { success: true, data: organization };
	} catch {
		return { success: false, error: "Failed to insert organization", data: null };
	}
});
type OrganizationInsert = ExtractServerActionData<typeof insertOrganization>;

const updateOrganization = createServerAction(async (values: UpdateOrganizationSchema) => {
	const validValues = UpdateOrganizationSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (user.emailAddress !== "jack.dowww@gmail.com") {
			return { success: false, error: "You are not authorized to view this page", data: null };
		}

		const { id, actions, ...data } = validValues.data;

		const organizationInviteLinksActionsLog = separateActionsLogSchema(actions?.organizationInviteLinks ?? {}, id);
		const usersActionsLog = separateActionsLogSchema(actions?.users ?? {}, id);

		await drizzle.transaction(async (trx) => {
			await trx.update(organizations).set(data).where(eq(organizations.id, id));

			//
			// ## Invite Links
			//
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

			//
			// ## Users
			//
			if (usersActionsLog.inserts.length > 0) {
				await trx.insert(users).values(usersActionsLog.inserts);
			}

			if (usersActionsLog.updates.length > 0) {
				for (const user of usersActionsLog.updates) {
					await trx.update(users).set(user).where(eq(users.id, user.id));
				}
			}

			if (usersActionsLog.deletes.length > 0) {
				await trx.delete(users).where(inArray(users.id, usersActionsLog.deletes));
			}
		});

		revalidatePath("/organizations");

		const organization = await drizzle.query.organizations.findFirst({
			where: eq(organizations.id, id),
			with: {
				users: true,
				organizationInviteLinks: {
					with: {
						user: {
							columns: {
								id: true,
								givenName: true,
								familyName: true,
								emailAddress: true,
								organizationRole: true,
								profileImageUrl: true,
							},
						},
					},
				},
			},
		});

		return { success: true, data: organization };
	} catch {
		return { success: false, error: "Failed to update organization", data: null };
	}
});
type OrganizationUpdate = ExtractServerActionData<typeof updateOrganization>;

const deleteOrganization = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (
			user.emailAddress !== "jack.dowww@gmail.com" &&
			(user.organizationRole !== "owner" || user.organizationId !== validId.data)
		) {
			return { success: false, error: "You are not authorized to view this page", data: null };
		}

		const organization = await drizzle.query.organizations.findFirst({
			where: eq(organizations.id, validId.data),
			columns: {
				id: true,
			},
		});

		if (organization) {
			await drizzle.transaction(async (trx) => {
				await trx.delete(organizations).where(eq(organizations.id, id));

				await trx.delete(bookingTypes).where(eq(bookingTypes.organizationId, id));
				await trx.delete(bookings).where(eq(bookings.organizationId, id));
				await trx.delete(clients).where(eq(clients.organizationId, id));
				await trx.delete(dogs).where(eq(dogs.organizationId, id));
				await trx.delete(users).where(eq(users.organizationId, id));
				await trx.delete(vetClinics).where(eq(vetClinics.organizationId, id));
				await trx.delete(vets).where(eq(vets.organizationId, id));
				await trx.delete(dogToClientRelationships).where(eq(dogToClientRelationships.organizationId, id));
				await trx.delete(dogToVetRelationships).where(eq(dogToVetRelationships.organizationId, id));
				await trx.delete(vetToVetClinicRelationships).where(eq(vetToVetClinicRelationships.organizationId, id));
				await trx.delete(organizationInviteLinks).where(eq(organizationInviteLinks.organizationId, id));
			});
		}

		revalidatePath("/organizations");

		return { success: true, data: validId.data };
	} catch {
		return { success: false, error: "Failed to delete organization", data: null };
	}
});
type OrganizationDelete = ExtractServerActionData<typeof deleteOrganization>;

export {
	listOrganizations,
	type OrganizationsList,
	searchOrganizations,
	type OrganizationsSearch,
	getOrganizationById,
	type OrganizationById,
	getCurrentOrganization,
	type CurrentOrganization,
	getOrganizationInviteLinkById,
	type OrganizationInviteLinkById,
	insertOrganization,
	type OrganizationInsert,
	updateOrganization,
	type OrganizationUpdate,
	deleteOrganization,
	type OrganizationDelete,
};
