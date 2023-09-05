"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, like, or, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { clients, dogs, dogToClientRelationships } from "~/db/schema";
import { InsertClientSchema, UpdateClientSchema } from "~/db/validation";
import { CLIENTS_SORTABLE_COLUMNS } from "../sortable-columns";
import {
	constructFamilyName,
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
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: limit,
			offset: (page - 1) * limit,
			where: eq(clients.organizationId, user.organizationId),
			orderBy: (clients, { asc }) => (orderBy ? [...orderBy, asc(clients.id)] : [asc(clients.id)]),
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
			error: "Failed to list clients",
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
type ClientsList = ExtractServerActionData<typeof listClients>;

const searchClients = createServerAction(async (searchTerm: string) => {
	const validSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!validSearchTerm.success) {
		return { success: false, error: validSearchTerm.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.clients.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: 20,
			where: and(
				eq(clients.organizationId, user.organizationId),
				or(
					sql`CONCAT(${clients.givenName},' ', ${clients.familyName}) LIKE CONCAT('%', ${validSearchTerm.data}, '%')`,
					like(clients.emailAddress, `%${validSearchTerm.data}%`),
					like(clients.phoneNumber, `%${validSearchTerm.data}%`),
				),
			),
			orderBy: (clients, { asc }) => [asc(clients.givenName), asc(clients.familyName), asc(clients.id)],
		});

		return { success: true, data };
	} catch {
		return { success: false, error: "Failed to search clients", data: null };
	}
});
type ClientsSearch = ExtractServerActionData<typeof searchClients>;

const getClientById = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.clients.findFirst({
			where: and(eq(clients.organizationId, user.organizationId), eq(clients.id, validId.data)),
			with: {
				dogToClientRelationships: {
					with: {
						dog: {
							columns: {
								id: true,
								givenName: true,
								familyName: true,
								color: true,
								breed: true,
							},
						},
					},
				},
			},
		});

		return { success: true, data };
	} catch {
		return { success: false, error: `Failed to get client with id ${validId.data}`, data: null };
	}
});
type ClientById = ExtractServerActionData<typeof getClientById>;

const insertClient = createServerAction(async (values: InsertClientSchema) => {
	const validValues = InsertClientSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const { actions, dogToClientRelationships: dogToClientRelationshipsArray, ...data } = validValues.data;

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

				if (data.familyName) {
					const clientsDogs = await drizzle.query.dogs.findMany({
						columns: {
							id: true,
							familyName: true,
						},
						where: and(
							eq(dogs.organizationId, user.organizationId),
							inArray(
								dogs.id,
								dogToClientRelationshipsArray
									.filter(({ relationship }) => relationship === "owner")
									.map((dogToClientRelationship) => dogToClientRelationship.dogId),
							),
						),
					});

					for (const dog of clientsDogs) {
						await trx
							.update(dogs)
							.set({
								familyName:
									dog.familyName && !dog.familyName.includes(data.familyName)
										? [data.familyName, ...dog.familyName.split("/")].sort().join("/")
										: data.familyName,
							})
							.where(eq(dogs.id, dog.id));
					}
				}
			}
		});

		revalidatePath("/clients");

		const client = await drizzle.query.clients.findFirst({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			where: and(eq(clients.organizationId, user.organizationId), eq(clients.id, data.id)),
		});

		return { success: true, data: client };
	} catch {
		return { success: false, error: "Failed to insert client", data: null };
	}
});
type ClientInsert = ExtractServerActionData<typeof insertClient>;

const updateClient = createServerAction(async (values: UpdateClientSchema) => {
	const validValues = UpdateClientSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const { id, actions, dogToClientRelationships: dogToClientRelationshipsArray, ...data } = validValues.data;

		const dogToClientRelationshipsActionsLog = separateActionsLogSchema(
			actions?.dogToClientRelationships ?? {},
			user.organizationId,
		);

		const existingClient = await drizzle.query.clients.findFirst({
			where: and(eq(clients.organizationId, user.organizationId), eq(clients.id, id)),
			columns: {
				familyName: true,
			},

			with: {
				// Need to fetch the dogId of all the dogToClientRelationships that are being deleted, so we can update the family name of the dogs
				dogToClientRelationships: {
					columns: {
						id: true,
						dogId: true,
						relationship: true,
					},
				},
			},
		});

		if (!existingClient) {
			return { success: false, error: `Failed to find client with id ${id}`, data: null };
		}

		const dogsToUpdateFamilyNameIds = new Set<string>();

		await drizzle.transaction(async (trx) => {
			await trx
				.update(clients)
				.set(data)
				.where(and(eq(clients.organizationId, user.organizationId), eq(clients.id, id)));

			if (dogToClientRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(dogToClientRelationships).values(dogToClientRelationshipsActionsLog.inserts);

				dogToClientRelationshipsActionsLog.inserts.forEach(({ relationship, dogId }) => {
					if (relationship === "owner") {
						dogsToUpdateFamilyNameIds.add(dogId);
					}
				});
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

					const existingRelationship = existingClient.dogToClientRelationships.find(({ id }) => id === relationship.id);
					if (
						existingRelationship &&
						(relationship.relationship === "owner" || relationship.relationship !== existingRelationship?.relationship)
					) {
						dogsToUpdateFamilyNameIds.add(existingRelationship?.dogId);
					}
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

				existingClient.dogToClientRelationships.forEach(({ id, dogId }) => {
					if (dogToClientRelationshipsActionsLog.deletes.includes(id)) {
						dogsToUpdateFamilyNameIds.add(dogId);
					}
				});
			}

			// Ensure this clients dogs have the correct family name
			if (validValues.data.familyName !== existingClient.familyName) {
				dogToClientRelationshipsArray
					.filter(({ relationship }) => relationship === "owner")
					.forEach((relationship) => dogsToUpdateFamilyNameIds.add(relationship.dogId));
			}
		});

		if (dogsToUpdateFamilyNameIds.size > 0) {
			const dogsToUpdateFamilyName = await drizzle.query.dogs.findMany({
				columns: {
					id: true,
				},
				where: and(
					eq(dogs.organizationId, user.organizationId),
					inArray(dogs.id, Array.from(dogsToUpdateFamilyNameIds)),
				),
				with: {
					dogToClientRelationships: {
						columns: {
							relationship: true,
						},
						with: {
							client: {
								columns: {
									familyName: true,
								},
							},
						},
					},
				},
			});

			for (const dog of dogsToUpdateFamilyName) {
				await drizzle
					.update(dogs)
					.set({
						// Ensure if there are two owners with the same family name and one owners family name is changed, the other family name still exists
						familyName: constructFamilyName(dog.dogToClientRelationships),
					})
					.where(eq(dogs.id, dog.id));
			}
		}

		revalidatePath("/clients");
		revalidatePath("/dog/[id]");

		const client = await drizzle.query.clients.findFirst({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			where: and(eq(clients.organizationId, user.organizationId), eq(clients.id, id)),
		});

		return { success: true, data: client };
	} catch {
		return { success: false, error: "Failed to update client", data: null };
	}
});
type ClientUpdate = ExtractServerActionData<typeof updateClient>;

const deleteClient = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const client = await drizzle.query.clients.findFirst({
			where: and(eq(clients.organizationId, user.organizationId), eq(clients.id, id)),
			columns: {
				id: true,
			},
			with: {
				dogToClientRelationships: {
					columns: {
						id: true,
						relationship: true,
					},
					with: {
						dog: {
							with: {
								dogToClientRelationships: {
									columns: {
										id: true,
										relationship: true,
									},
									with: {
										client: {
											columns: {
												id: true,
												familyName: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		});

		if (!client) {
			return { success: false, error: `Client with id "${id}" not found`, data: null };
		}

		await drizzle.transaction(async (trx) => {
			await trx.delete(clients).where(eq(clients.id, id));

			if (client.dogToClientRelationships.length > 0) {
				for (const relationship of client.dogToClientRelationships.filter(
					(relationship) => relationship.relationship === "owner",
				)) {
					await drizzle
						.update(dogs)
						.set({
							// Ensure if there are two owners with the same family name and one owners family name is changed, the other family name still exists
							familyName: constructFamilyName(
								relationship.dog.dogToClientRelationships.filter((relationship) => relationship.client.id !== id),
							),
						})
						.where(eq(dogs.id, relationship.dog.id));
				}

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
		return { success: false, error: "Failed to delete client", data: null };
	}
});
type ClientDelete = ExtractServerActionData<typeof deleteClient>;

export {
	listClients,
	type ClientsList,
	searchClients,
	type ClientsSearch,
	getClientById,
	type ClientById,
	insertClient,
	type ClientInsert,
	updateClient,
	type ClientUpdate,
	deleteClient,
	type ClientDelete,
};
