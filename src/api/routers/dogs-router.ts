"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray, like } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { dogClientRelationships, dogs } from "~/db/drizzle-schema";
import {
	InsertDogSchema,
	UpdateDogSchema,
	type InsertDogClientRelationshipSchema,
	type UpdateDogClientRelationshipSchema,
} from "~/db/drizzle-zod";
import { createRouterResponse, SearchTermSchema } from "../utils";

const listDogs = createRouterResponse(async (limit?: number) => {
	try {
		const data = await drizzle.query.dogs.findMany({
			limit: limit ?? 50,
		});

		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Failed to list dogs" };
	}
});

const searchDogs = createRouterResponse(async (searchTerm: string) => {
	const validSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!validSearchTerm.success) {
		return { success: false, error: validSearchTerm.error.issues };
	}

	try {
		const data = await drizzle.query.dogs.findMany({
			where: like(dogs.givenName, `%${validSearchTerm.data ?? ""}%`),
			limit: 50,
		});

		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Failed to search dogs" };
	}
});

const getDogById = createRouterResponse(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues };
	}

	try {
		const data = await drizzle.query.dogs.findFirst({
			where: eq(dogs.id, validId.data),
			with: {
				clientRelationships: {
					with: {
						client: {
							with: {
								dogRelationships: {
									with: {
										dog: true,
									},
								},
							},
						},
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false, error: `Failed to fetch dog with id: ${id}` };
	}
});

const insertDog = createRouterResponse(async (values: InsertDogSchema) => {
	const safeValues = InsertDogSchema.safeParse(values);

	if (!safeValues.success) {
		return { success: false, error: safeValues.error.issues };
	}

	try {
		const { actions, clientRelationships: _, ...data } = safeValues.data;

		const newClientRelationships: Array<InsertDogClientRelationshipSchema> = [];

		for (const id in actions.clientRelationships) {
			const clientRelationship = actions.clientRelationships[id];

			if (!clientRelationship) {
				continue;
			}

			if (clientRelationship.type === "INSERT") {
				newClientRelationships.push(clientRelationship.payload);
			}
		}

		await drizzle.transaction(async (trx) => {
			await trx.insert(dogs).values(data);
			if (newClientRelationships.length > 0) {
				await trx.insert(dogClientRelationships).values(newClientRelationships);
			}
		});

		revalidatePath("/dogs");
		revalidatePath("/dogs/[id]");

		return { success: true };
	} catch (error) {
		console.error(error);
		return { success: false, error: `Failed to insert dog with id: ${safeValues.data.id}` };
	}
});

const updateDog = createRouterResponse(async (values: UpdateDogSchema) => {
	const safeValues = UpdateDogSchema.safeParse(values);

	if (!safeValues.success) {
		return { success: false, error: safeValues.error.issues };
	}

	try {
		const { id, actions, clientRelationships: _, ...data } = safeValues.data;

		const newClientRelationships: Array<InsertDogClientRelationshipSchema> = [];
		const updatedClientRelationships: Array<UpdateDogClientRelationshipSchema> = [];
		const deletedClientRelationships: Array<string> = [];

		for (const id in actions.clientRelationships) {
			const clientRelationship = actions.clientRelationships[id];

			if (!clientRelationship) {
				continue;
			}

			if (clientRelationship.type === "INSERT") {
				newClientRelationships.push(clientRelationship.payload);
			}

			if (clientRelationship.type === "UPDATE") {
				updatedClientRelationships.push(clientRelationship.payload);
			}

			if (clientRelationship.type === "DELETE") {
				deletedClientRelationships.push(id);
			}
		}

		await drizzle.transaction(async (trx) => {
			await trx.update(dogs).set(data).where(eq(dogs.id, id));

			if (newClientRelationships.length > 0) {
				await trx.insert(dogClientRelationships).values(newClientRelationships);
			}

			if (updatedClientRelationships.length > 0) {
				for (const updatedClientRelationship of updatedClientRelationships) {
					await trx
						.update(dogClientRelationships)
						.set(updatedClientRelationship)
						.where(eq(dogClientRelationships.id, updatedClientRelationship.id));
				}
			}

			if (deletedClientRelationships.length > 0) {
				await trx.delete(dogClientRelationships).where(inArray(dogClientRelationships.id, deletedClientRelationships));
			}
		});

		revalidatePath("/dogs");
		revalidatePath("/dogs/[id]");

		return { success: true };
	} catch (error) {
		console.error(error);
		return { success: false, error: `Failed to update dog with id: ${safeValues.data.id}` };
	}
});

const deleteDog = createRouterResponse(async (id: string) => {
	const safeId = z.string().safeParse(id);

	if (!safeId.success) {
		return { success: false, error: safeId.error.issues };
	}

	try {
		const dog = await drizzle.query.dogs.findFirst({
			where: eq(dogs.id, safeId.data),
			columns: {
				id: true,
			},
			with: {
				clientRelationships: true,
			},
		});

		if (dog) {
			await drizzle.transaction(async (trx) => {
				if (dog.clientRelationships.length > 0) {
					await trx.delete(dogClientRelationships).where(
						inArray(
							dogClientRelationships.id,
							dog.clientRelationships.map((c) => c.id),
						),
					);
				}
				await trx.delete(dogs).where(eq(dogs.id, id));
			});
		}

		revalidatePath("/dogs");

		return { success: true, data: safeId.data };
	} catch (error) {
		console.error(error);
		return { success: false, error: `Failed to fetch dog with id: ${id}` };
	}
});

export { listDogs, searchDogs, getDogById, insertDog, updateDog, deleteDog };
