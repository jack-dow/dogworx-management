"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { clients, dogClientRelationships } from "~/db/drizzle-schema";
import {
	InsertClientSchema,
	UpdateClientSchema,
	type InsertDogClientRelationshipSchema,
	type UpdateDogClientRelationshipSchema,
} from "~/db/drizzle-zod";
import { createRouterResponse, SearchTermSchema } from "../utils";

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
		const { actions, dogRelationships: _, ...data } = safeValues.data;

		const newDogRelationships: Array<InsertDogClientRelationshipSchema> = [];

		for (const id in actions.dogRelationships) {
			const dogRelationship = actions.dogRelationships[id];

			if (!dogRelationship) {
				continue;
			}

			if (dogRelationship.type === "INSERT") {
				newDogRelationships.push(dogRelationship.payload);
			}
		}

		await drizzle.transaction(async (trx) => {
			await trx.insert(clients).values(data);
			if (newDogRelationships.length > 0) {
				await trx.insert(dogClientRelationships).values(newDogRelationships);
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
		const { id, actions, dogRelationships: _, ...data } = safeValues.data;

		const newDogRelationships: Array<InsertDogClientRelationshipSchema> = [];
		const updatedDogRelationships: Array<UpdateDogClientRelationshipSchema> = [];
		const deletedDogRelationships: Array<string> = [];

		for (const id in actions.dogRelationships) {
			const dogRelationship = actions.dogRelationships[id];

			if (!dogRelationship) {
				continue;
			}

			if (dogRelationship.type === "INSERT") {
				newDogRelationships.push(dogRelationship.payload);
			}

			if (dogRelationship.type === "UPDATE") {
				updatedDogRelationships.push(dogRelationship.payload);
			}

			if (dogRelationship.type === "DELETE") {
				deletedDogRelationships.push(id);
			}
		}

		await drizzle.transaction(async (trx) => {
			await trx.update(clients).set(data).where(eq(clients.id, id));

			if (newDogRelationships.length > 0) {
				await trx.insert(dogClientRelationships).values(newDogRelationships);
			}

			if (updatedDogRelationships.length > 0) {
				for (const relationship of updatedDogRelationships) {
					await trx
						.update(dogClientRelationships)
						.set(relationship)
						.where(eq(dogClientRelationships.id, relationship.id));
				}
			}

			if (deletedDogRelationships.length > 0) {
				await trx.delete(dogClientRelationships).where(inArray(dogClientRelationships.id, deletedDogRelationships));
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
