"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { clients, dogClientRelationships } from "~/db/drizzle-schema";
import { InsertClientSchema, UpdateClientSchema } from "~/db/drizzle-zod";
import { createRouterResponse, SearchTermSchema, separateActionSchema } from "../utils";

const listClients = createRouterResponse(async (limit?: number) => {
	try {
		const data = await drizzle.query.clients.findMany({
			limit: limit ?? 50,
			with: {
				dogRelationships: {
					with: {
						dog: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Failed to list clients" };
	}
});

const searchClients = createRouterResponse(async (searchTerm: string) => {
	const safeSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!safeSearchTerm.success) {
		return { success: false, error: safeSearchTerm.error.issues };
	}

	try {
		const data = await drizzle.query.clients.findMany({
			where: sql`concat(${clients.givenName},' ', ${clients.familyName}) LIKE CONCAT('%', ${safeSearchTerm.data}, '%')`,
			limit: 50,
			with: {
				dogRelationships: {
					with: {
						dog: {
							with: {
								clientRelationships: true,
							},
						},
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Failed to search clients" };
	}
});

const insertClient = createRouterResponse(async (values: InsertClientSchema) => {
	const safeValues = InsertClientSchema.safeParse(values);

	if (!safeValues.success) {
		return { success: false, error: safeValues.error.issues };
	}

	try {
		const { actions, ...data } = safeValues.data;

		delete data.dogRelationships;

		const dogClientRelationshipActions = separateActionSchema(actions.dogRelationships);

		await drizzle.transaction(async (trx) => {
			await trx.insert(clients).values(data);
			if (dogClientRelationshipActions.inserts.length > 0) {
				await trx.insert(dogClientRelationships).values(dogClientRelationshipActions.inserts);
			}
		});

		revalidatePath("/clients");

		const client = await drizzle.query.clients.findFirst({
			where: eq(clients.id, data.id),
			with: {
				dogRelationships: {
					with: {
						dog: {
							with: {
								clientRelationships: true,
							},
						},
					},
				},
			},
		});

		return { success: true, data: client };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Failed to insert client" };
	}
});

const updateClient = createRouterResponse(async (values: UpdateClientSchema) => {
	const safeValues = UpdateClientSchema.safeParse(values);

	if (!safeValues.success) {
		return { success: false, error: safeValues.error.issues };
	}

	try {
		const { id, actions, ...data } = safeValues.data;

		delete data.dogRelationships;

		const dogClientRelationshipActions = separateActionSchema(actions.dogRelationships);

		await drizzle.transaction(async (trx) => {
			await trx.update(clients).set(data).where(eq(clients.id, id));

			if (dogClientRelationshipActions.inserts.length > 0) {
				await trx.insert(dogClientRelationships).values(dogClientRelationshipActions.inserts);
			}

			if (dogClientRelationshipActions.updates.length > 0) {
				for (const relationship of dogClientRelationshipActions.updates) {
					await trx
						.update(dogClientRelationships)
						.set(relationship)
						.where(eq(dogClientRelationships.id, relationship.id));
				}
			}

			if (dogClientRelationshipActions.deletes.length > 0) {
				await trx
					.delete(dogClientRelationships)
					.where(inArray(dogClientRelationships.id, dogClientRelationshipActions.deletes));
			}
		});

		revalidatePath("/clients");

		const client = await drizzle.query.clients.findFirst({
			where: eq(clients.id, id),
			with: {
				dogRelationships: {
					with: {
						dog: {
							with: {
								clientRelationships: true,
							},
						},
					},
				},
			},
		});

		return { success: true, data: client };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Failed to update client" };
	}
});

const deleteClient = createRouterResponse(async (id: string) => {
	const safeId = z.string().safeParse(id);

	if (!safeId.success) {
		return { success: false, error: safeId.error.issues };
	}

	try {
		const client = await drizzle.query.clients.findFirst({
			where: eq(clients.id, safeId.data),
			columns: {
				id: true,
			},
			with: {
				dogRelationships: true,
			},
		});

		if (client) {
			await drizzle.transaction(async (trx) => {
				if (client.dogRelationships.length > 0) {
					await trx.delete(dogClientRelationships).where(
						inArray(
							dogClientRelationships.id,
							client.dogRelationships.map((c) => c.id),
						),
					);
				}
				await trx.delete(clients).where(eq(clients.id, id));
			});
		}

		revalidatePath("/clients");

		return { success: true, data: safeId.data };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Failed to delete client" };
	}
});

export { listClients, searchClients, insertClient, updateClient, deleteClient };
