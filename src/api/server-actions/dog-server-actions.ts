"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs";
import { type User } from "@clerk/nextjs/dist/types/server";
import { eq, inArray, like } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { dogClientRelationships, dogs, dogSessionHistory } from "~/db/drizzle-schema";
import { createServerAction } from "../utils";
import { UserSchema } from "../validations/clerk";
import { InsertDogSchema, UpdateDogSchema } from "../validations/dogs";
import { SearchTermSchema, separateActionLogSchema } from "../validations/utils";

const listDogs = createServerAction(async (limit?: number) => {
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

const searchDogs = createServerAction(async (searchTerm: string) => {
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

const getDogById = createServerAction(async (id: string) => {
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
				sessionHistory: true,
			},
		});

		const userIds = data?.sessionHistory.map((session) => session.userId);
		let users: User[] = [];

		if (userIds && userIds.length > 0) {
			users = await clerkClient.users.getUserList({
				userId: userIds,
			});
		}

		return {
			success: true,
			data: data
				? {
						...data,
						sessionHistory: data?.sessionHistory.map((session) => {
							const user = UserSchema.safeParse(users.find((user) => user.id === session.userId));
							return {
								...session,
								user: user.success ? user.data : undefined,
							};
						}),
				  }
				: undefined,
		};
	} catch (error) {
		console.error(error);
		return { success: false, error: `Failed to fetch dog with id: ${id}` };
	}
});

const insertDog = createServerAction(async (values: InsertDogSchema) => {
	const validValues = InsertDogSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const { actions, ...data } = validValues.data;

		const clientRelationshipActionLog = separateActionLogSchema(actions.clientRelationships);
		const sessionHistoryActionLog = separateActionLogSchema(actions.sessionHistory);

		await drizzle.transaction(async (trx) => {
			await trx.insert(dogs).values(data);

			if (clientRelationshipActionLog.inserts.length > 0) {
				await trx.insert(dogClientRelationships).values(clientRelationshipActionLog.inserts);
			}

			if (sessionHistoryActionLog.inserts.length > 0) {
				await trx.insert(dogSessionHistory).values(sessionHistoryActionLog.inserts);
			}
		});

		revalidatePath("/dogs");
		revalidatePath("/dogs/[id]");

		return { success: true };
	} catch (error) {
		console.error(error);
		return { success: false, error: `Failed to insert dog with id: ${validValues.data.id}` };
	}
});

const updateDog = createServerAction(async (values: UpdateDogSchema) => {
	const validValues = UpdateDogSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const { id, actions, ...data } = validValues.data;

		const clientRelationshipActionLog = separateActionLogSchema(actions?.clientRelationships ?? {});
		const sessionHistoryActionLog = separateActionLogSchema(actions?.sessionHistory ?? {});

		await drizzle.transaction(async (trx) => {
			await trx.update(dogs).set(data).where(eq(dogs.id, id));

			//
			// ## Client Relationship Actions
			//
			if (clientRelationshipActionLog.inserts.length > 0) {
				await trx.insert(dogClientRelationships).values(clientRelationshipActionLog.inserts);
			}

			if (clientRelationshipActionLog.updates.length > 0) {
				for (const updatedClientRelationship of clientRelationshipActionLog.updates) {
					await trx
						.update(dogClientRelationships)
						.set(updatedClientRelationship)
						.where(eq(dogClientRelationships.id, updatedClientRelationship.id));
				}
			}

			if (clientRelationshipActionLog.deletes.length > 0) {
				await trx
					.delete(dogClientRelationships)
					.where(inArray(dogClientRelationships.id, clientRelationshipActionLog.deletes));
			}

			//
			// ## Session History
			//
			if (sessionHistoryActionLog.inserts.length > 0) {
				await trx.insert(dogSessionHistory).values(sessionHistoryActionLog.inserts);
			}

			if (sessionHistoryActionLog.updates.length > 0) {
				for (const updatedSessionHistory of sessionHistoryActionLog.updates) {
					await trx
						.update(dogSessionHistory)
						.set(updatedSessionHistory)
						.where(eq(dogSessionHistory.id, updatedSessionHistory.id));
				}
			}

			if (sessionHistoryActionLog.deletes.length > 0) {
				await trx.delete(dogSessionHistory).where(inArray(dogSessionHistory.id, sessionHistoryActionLog.deletes));
			}
		});

		revalidatePath("/dogs");
		revalidatePath("/dogs/[id]");

		return { success: true };
	} catch (error) {
		console.error(error);
		return { success: false, error: `Failed to update dog with id: ${validValues.data.id}` };
	}
});

const deleteDog = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues };
	}

	try {
		const dog = await drizzle.query.dogs.findFirst({
			where: eq(dogs.id, validId.data),
			columns: {
				id: true,
			},
			with: {
				clientRelationships: true,
				sessionHistory: true,
			},
		});

		if (dog) {
			await drizzle.transaction(async (trx) => {
				await trx.delete(dogs).where(eq(dogs.id, id));

				if (dog.sessionHistory.length > 0) {
					await trx.delete(dogSessionHistory).where(
						inArray(
							dogSessionHistory.id,
							dog.sessionHistory.map((s) => s.id),
						),
					);
				}

				if (dog.clientRelationships.length > 0) {
					await trx.delete(dogClientRelationships).where(
						inArray(
							dogClientRelationships.id,
							dog.clientRelationships.map((c) => c.id),
						),
					);
				}
			});
		}

		revalidatePath("/dogs");

		return { success: true, data: validId.data };
	} catch (error) {
		console.error(error);
		return { success: false, error: `Failed to fetch dog with id: ${id}` };
	}
});

export { listDogs, searchDogs, getDogById, insertDog, updateDog, deleteDog };
