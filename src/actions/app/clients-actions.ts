"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { clients, dogToClientRelationships } from "~/db/schemas";
import { InsertClientSchema, UpdateClientSchema } from "~/db/validation";
import { CLIENTS_SORTABLE_COLUMNS } from "../sortable-columns";
import {
	createServerAction,
	getServerUser,
	SearchTermSchema,
	separateActionsLogSchema,
	validatePaginationSearchParams,
	type ExtractServerActionData,
	type PaginationSearchParams,
} from "../utils";

const listClients = createServerAction(async (options: PaginationSearchParams) => {
	try {
		const user = await getServerUser();

		const countQuery = await drizzle
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(clients)
			.where(eq(clients.organizationId, user.organizationId));

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...options,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: CLIENTS_SORTABLE_COLUMNS,
		});

		const data = await drizzle.query.clients.findMany({
			limit: limit,
			offset: (page - 1) * limit,
			where: eq(clients.organizationId, user.organizationId),
			orderBy: (clients, { asc }) => (orderBy ? [...orderBy, asc(clients.id)] : [asc(clients.id)]),
			with: {
				dogToClientRelationships: {
					with: {
						dog: true,
					},
				},
			},
		});

		return {
			success: true,
			data: {
				count,
				page,
				maxPage,
				limit,
				sortBy,
				sortDirection,
				data,
			},
		};
	} catch {
		return { success: false, error: "Failed to list clients" };
	}
});
type ClientsList = ExtractServerActionData<typeof listClients>;

const searchClients = createServerAction(async (searchTerm: string) => {
	const validSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!validSearchTerm.success) {
		return { success: false, error: validSearchTerm.error.issues };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.clients.findMany({
			limit: 50,
			where: and(
				eq(clients.organizationId, user.organizationId),
				sql`CONCAT(${clients.givenName},' ', ${clients.familyName}) LIKE CONCAT('%', ${validSearchTerm.data}, '%')`,
			),
			orderBy: (clients, { asc }) => [asc(clients.givenName), asc(clients.familyName), asc(clients.id)],
			with: {
				dogToClientRelationships: {
					with: {
						dog: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch {
		return { success: false, error: "Failed to search clients" };
	}
});
type ClientsSearch = ExtractServerActionData<typeof searchClients>;

const insertClient = createServerAction(async (values: InsertClientSchema) => {
	const validValues = InsertClientSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const user = await getServerUser();

		const { actions, ...data } = validValues.data;

		const dogToClientRelationshipsActionsLog = separateActionsLogSchema(
			actions.dogToClientRelationships,
			user.organizationId,
		);

		await drizzle.transaction(async (trx) => {
			await trx.insert(clients).values({
				...data,
				organizationId: user.organizationId,
			});

			if (dogToClientRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(dogToClientRelationships).values(dogToClientRelationshipsActionsLog.inserts);
			}
		});

		revalidatePath("/clients");

		const client = await drizzle.query.clients.findFirst({
			where: and(eq(clients.organizationId, user.organizationId), eq(clients.id, data.id)),
			with: {
				dogToClientRelationships: {
					with: {
						dog: true,
					},
				},
			},
		});

		return { success: true, data: client };
	} catch {
		return { success: false, error: "Failed to insert client" };
	}
});
type ClientInsert = ExtractServerActionData<typeof insertClient>;

const updateClient = createServerAction(async (values: UpdateClientSchema) => {
	const validValues = UpdateClientSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const user = await getServerUser();

		const { id, actions, ...data } = validValues.data;

		const dogToClientRelationshipsActionsLog = separateActionsLogSchema(
			actions?.dogToClientRelationships ?? {},
			user.organizationId,
		);

		await drizzle.transaction(async (trx) => {
			await trx
				.update(clients)
				.set(data)
				.where(and(eq(clients.organizationId, user.organizationId), eq(clients.id, id)));

			if (dogToClientRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(dogToClientRelationships).values(dogToClientRelationshipsActionsLog.inserts);
			}

			if (dogToClientRelationshipsActionsLog.updates.length > 0) {
				for (const relationship of dogToClientRelationshipsActionsLog.updates) {
					await trx
						.update(dogToClientRelationships)
						.set(relationship)
						.where(
							and(
								eq(dogToClientRelationships.organizationId, user.organizationId),
								eq(dogToClientRelationships.id, relationship.id),
							),
						);
				}
			}

			if (dogToClientRelationshipsActionsLog.deletes.length > 0) {
				await trx
					.delete(dogToClientRelationships)
					.where(
						and(
							eq(dogToClientRelationships.organizationId, user.organizationId),
							inArray(dogToClientRelationships.id, dogToClientRelationshipsActionsLog.deletes),
						),
					);
			}
		});

		revalidatePath("/clients");
		revalidatePath("/dogs/[id]");

		const client = await drizzle.query.clients.findFirst({
			where: and(eq(clients.organizationId, user.organizationId), eq(clients.id, id)),
			with: {
				dogToClientRelationships: {
					with: {
						dog: true,
					},
				},
			},
		});

		return { success: true, data: client };
	} catch {
		return { success: false, error: "Failed to update client" };
	}
});
type ClientUpdate = ExtractServerActionData<typeof updateClient>;

const deleteClient = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues };
	}

	try {
		const user = await getServerUser();

		const client = await drizzle.query.clients.findFirst({
			where: and(eq(clients.organizationId, user.organizationId), eq(clients.id, id)),
			columns: {
				id: true,
			},
			with: {
				dogToClientRelationships: true,
			},
		});

		if (!client) {
			return { success: false, error: `Client with id "${id}" not found` };
		}

		await drizzle.transaction(async (trx) => {
			await trx.delete(clients).where(eq(clients.id, id));

			if (client.dogToClientRelationships.length > 0) {
				await trx.delete(dogToClientRelationships).where(
					inArray(
						dogToClientRelationships.id,
						client.dogToClientRelationships.map((c) => c.id),
					),
				);
			}
		});

		revalidatePath("/clients");

		return { success: true, data: validId.data };
	} catch {
		return { success: false, error: "Failed to delete client" };
	}
});
type ClientDelete = ExtractServerActionData<typeof deleteClient>;

const getClientRelationships = createServerAction(async (clientId: string) => {
	try {
		const user = await getServerUser();

		const dogToClientRelationshipsData = await drizzle.query.dogToClientRelationships.findMany({
			limit: 25,
			where: and(
				eq(dogToClientRelationships.organizationId, user.organizationId),
				eq(dogToClientRelationships.clientId, clientId),
			),
			with: {
				dog: true,
			},
		});

		return {
			success: true,
			data: {
				dogToClientRelationships: dogToClientRelationshipsData,
			},
		};
	} catch {
		return { success: false, error: `Failed to get client relationships with client id: "${clientId}"` };
	}
});
type ClientRelationships = ExtractServerActionData<typeof getClientRelationships>;

export {
	listClients,
	type ClientsList,
	searchClients,
	type ClientsSearch,
	insertClient,
	type ClientInsert,
	updateClient,
	type ClientUpdate,
	deleteClient,
	type ClientDelete,
	getClientRelationships,
	type ClientRelationships,
};
