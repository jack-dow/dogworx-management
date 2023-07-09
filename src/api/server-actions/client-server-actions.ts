"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { clients, dogToClientRelationships } from "~/db/drizzle-schema";
import { createServerAction } from "../utils";
import { InsertClientSchema, UpdateClientSchema } from "../validations/clients";
import { SearchTermSchema, separateActionLogSchema } from "../validations/utils";

const listClients = createServerAction(async (limit?: number) => {
	try {
		const data = await drizzle.query.clients.findMany({
			limit: limit ?? 50,
			with: {
				dogToClientRelationships: {
					with: {
						dog: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to list clients" };
	}
});

const searchClients = createServerAction(async (searchTerm: string) => {
	const validSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!validSearchTerm.success) {
		return { success: false, error: validSearchTerm.error.issues };
	}

	try {
		const data = await drizzle.query.clients.findMany({
			where: sql`concat(${clients.givenName},' ', ${clients.familyName}) LIKE CONCAT('%', ${validSearchTerm.data}, '%')`,
			limit: 50,
			with: {
				dogToClientRelationships: {
					with: {
						dog: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to search clients" };
	}
});

const insertClient = createServerAction(async (values: InsertClientSchema) => {
	const validValues = InsertClientSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const { actions, ...data } = validValues.data;

		const dogToClientRelationshipsActionLog = separateActionLogSchema(actions.dogToClientRelationships);

		await drizzle.transaction(async (trx) => {
			await trx.insert(clients).values(data);

			if (dogToClientRelationshipsActionLog.inserts.length > 0) {
				await trx.insert(dogToClientRelationships).values(dogToClientRelationshipsActionLog.inserts);
			}
		});

		revalidatePath("/clients");

		const client = await drizzle.query.clients.findFirst({
			where: eq(clients.id, data.id),
			with: {
				dogToClientRelationships: {
					with: {
						dog: true,
					},
				},
			},
		});

		return { success: true, data: client };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to insert client" };
	}
});

const updateClient = createServerAction(async (values: UpdateClientSchema) => {
	const validValues = UpdateClientSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const { id, actions, ...data } = validValues.data;

		const dogToClientRelationshipsActionLog = separateActionLogSchema(actions?.dogToClientRelationships ?? {});

		await drizzle.transaction(async (trx) => {
			await trx.update(clients).set(data).where(eq(clients.id, id));

			if (dogToClientRelationshipsActionLog.inserts.length > 0) {
				await trx.insert(dogToClientRelationships).values(dogToClientRelationshipsActionLog.inserts);
			}

			if (dogToClientRelationshipsActionLog.updates.length > 0) {
				for (const relationship of dogToClientRelationshipsActionLog.updates) {
					await trx
						.update(dogToClientRelationships)
						.set(relationship)
						.where(eq(dogToClientRelationships.id, relationship.id));
				}
			}

			if (dogToClientRelationshipsActionLog.deletes.length > 0) {
				await trx
					.delete(dogToClientRelationships)
					.where(inArray(dogToClientRelationships.id, dogToClientRelationshipsActionLog.deletes));
			}
		});

		revalidatePath("/clients");
		revalidatePath("/dogs/[id]");

		const client = await drizzle.query.clients.findFirst({
			where: eq(clients.id, id),
			with: {
				dogToClientRelationships: {
					with: {
						dog: true,
					},
				},
			},
		});

		return { success: true, data: client };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to update client" };
	}
});

const deleteClient = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues };
	}

	try {
		const client = await drizzle.query.clients.findFirst({
			where: eq(clients.id, validId.data),
			columns: {
				id: true,
			},
			with: {
				dogToClientRelationships: true,
			},
		});

		if (client) {
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
		}

		revalidatePath("/clients");

		return { success: true, data: validId.data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to delete client" };
	}
});

export { listClients, searchClients, insertClient, updateClient, deleteClient };
