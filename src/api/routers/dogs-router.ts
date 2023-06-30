"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs";
import { type User } from "@clerk/nextjs/dist/types/server";
import { eq, inArray, like } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { dogClientRelationships, dogs, dogSessionHistory } from "~/db/drizzle-schema";
import { InsertDogSchema, UpdateDogSchema } from "~/db/drizzle-zod";
import { createRouterResponse, SearchTermSchema, separateActionSchema } from "../utils";

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
							const user = users.find((user) => user.id === session.userId);
							return {
								...session,
								user: user
									? {
											id: user.id,
											firstName: user.firstName,
											lastName: user.lastName,
											emailAddresses: user.emailAddresses.map((email) => ({
												id: email.id,
												emailAddress: email.emailAddress,
											})),
									  }
									: undefined,
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

const insertDog = createRouterResponse(async (values: InsertDogSchema) => {
	const safeValues = InsertDogSchema.safeParse(values);

	if (!safeValues.success) {
		return { success: false, error: safeValues.error.issues };
	}

	try {
		const { actions, ...data } = safeValues.data;

		delete data.clientRelationships;
		delete data.sessionHistory;

		const clientRelationshipActions = separateActionSchema(actions.clientRelationships);
		const sessionHistory = separateActionSchema(actions.sessionHistory);

		await drizzle.transaction(async (trx) => {
			await trx.insert(dogs).values(data);

			if (clientRelationshipActions.inserts.length > 0) {
				await trx.insert(dogClientRelationships).values(clientRelationshipActions.inserts);
			}

			if (sessionHistory.inserts.length > 0) {
				await trx.insert(dogSessionHistory).values(sessionHistory.inserts);
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
		const { id, actions, ...data } = safeValues.data;

		delete data.clientRelationships;
		delete data.sessionHistory;

		// Have to remove user from session history otherwise it causes drizzle error
		// because it's not a valid column
		const sessionHistory = {};

		if (actions.sessionHistory) {
			for (const [key, session] of Object.entries(actions.sessionHistory)) {
				if (session.type === "INSERT" || session.type === "UPDATE") {
					sessionHistory[key] = {
						type: session.type,
						payload: {
							...session.payload,
							user: undefined,
						},
					};
				} else {
					sessionHistory[key] = {
						type: session.type,
						payload: session.payload,
					};
				}
			}
		}

		const clientRelationshipActions = separateActionSchema(actions.clientRelationships);
		const sessionHistoryActions = separateActionSchema(sessionHistory);

		await drizzle.transaction(async (trx) => {
			await trx.update(dogs).set(data).where(eq(dogs.id, id));

			//
			// ## Client Relationship Actions
			//
			if (clientRelationshipActions.inserts.length > 0) {
				await trx.insert(dogClientRelationships).values(clientRelationshipActions.inserts);
			}

			if (clientRelationshipActions.updates.length > 0) {
				for (const updatedClientRelationship of clientRelationshipActions.updates) {
					await trx
						.update(dogClientRelationships)
						.set(updatedClientRelationship)
						.where(eq(dogClientRelationships.id, updatedClientRelationship.id));
				}
			}

			if (clientRelationshipActions.deletes.length > 0) {
				await trx
					.delete(dogClientRelationships)
					.where(inArray(dogClientRelationships.id, clientRelationshipActions.deletes));
			}

			//
			// ## Session History
			//
			if (sessionHistoryActions.inserts.length > 0) {
				await trx.insert(dogSessionHistory).values(sessionHistoryActions.inserts);
			}

			if (sessionHistoryActions.updates.length > 0) {
				for (const updatedSessionHistory of sessionHistoryActions.updates) {
					delete updatedSessionHistory.user;

					await trx
						.update(dogSessionHistory)
						.set(updatedSessionHistory)
						.where(eq(dogSessionHistory.id, updatedSessionHistory.id));
				}
			}

			if (sessionHistoryActions.deletes.length > 0) {
				await trx.delete(dogSessionHistory).where(inArray(dogSessionHistory.id, sessionHistoryActions.deletes));
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
