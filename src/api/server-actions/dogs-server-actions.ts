"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray, like } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/server/db/drizzle";
import { dogs, dogSessions, dogToClientRelationships, dogToVetRelationships } from "~/server/db/schemas";
import { createServerAction, type ExtractServerActionData } from "../utils";
import { InsertDogSchema, UpdateDogSchema } from "../validations/dogs";
import { SearchTermSchema, separateActionsLogSchema } from "../validations/utils";

const listDogs = createServerAction(async (limit?: number) => {
	try {
		const data = await drizzle.query.dogs.findMany({
			limit: limit ?? 50,
		});

		return { success: true, data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to list dogs" };
	}
});
type DogsList = ExtractServerActionData<typeof listDogs>;

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
		console.log(error);
		return { success: false, error: "Failed to search dogs" };
	}
});
type DogsSearch = ExtractServerActionData<typeof searchDogs>;

const getDogById = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues };
	}

	try {
		const data = await drizzle.query.dogs.findFirst({
			where: eq(dogs.id, validId.data),
			with: {
				sessions: true,
				dogToClientRelationships: {
					with: {
						client: true,
					},
				},
				dogToVetRelationships: {
					with: {
						vet: true,
					},
				},
			},
		});

		const userIds = data?.sessions.map((session) => session.userId);

		return {
			success: true,
			data: data
				? {
						...data,
						// sessions: data?.sessions.map((session) => {
						// 	const user = UserSchema.safeParse(users.find((user) => user.id === session.userId));
						// 	return {
						// 		...session,
						// 		user: user.success ? user.data : undefined,
						// 	};
						// }),
				  }
				: undefined,
		};
	} catch (error) {
		console.log(error);
		return { success: false, error: `Failed to fetch dog with id: ${id}` };
	}
});
type DogById = ExtractServerActionData<typeof getDogById>;

const insertDog = createServerAction(async (values: InsertDogSchema) => {
	const validValues = InsertDogSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const { actions, ...data } = validValues.data;

		const sessionsActionsLog = separateActionsLogSchema(actions.sessions);
		const dogToClientRelationshipsActionsLog = separateActionsLogSchema(actions.dogToClientRelationships);
		const dogToVetRelationshipsActionsLog = separateActionsLogSchema(actions.dogToVetRelationships);

		await drizzle.transaction(async (trx) => {
			await trx.insert(dogs).values(data);

			if (sessionsActionsLog.inserts.length > 0) {
				await trx.insert(dogSessions).values(sessionsActionsLog.inserts);
			}

			if (dogToClientRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(dogToClientRelationships).values(dogToClientRelationshipsActionsLog.inserts);
			}

			if (dogToVetRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(dogToVetRelationships).values(dogToVetRelationshipsActionsLog.inserts);
			}
		});

		revalidatePath("/dogs");
		revalidatePath("/dogs/[id]");

		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false, error: `Failed to insert dog with id: ${validValues.data.id}` };
	}
});
type DogInsert = ExtractServerActionData<typeof insertDog>;

const updateDog = createServerAction(async (values: UpdateDogSchema) => {
	const validValues = UpdateDogSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const { id, actions, ...data } = validValues.data;

		const sessionsActionsLog = separateActionsLogSchema(actions?.sessions ?? {});
		const dogToClientRelationshipsActionsLog = separateActionsLogSchema(actions?.dogToClientRelationships ?? {});
		const dogToVetRelationshipsActionsLog = separateActionsLogSchema(actions?.dogToVetRelationships ?? {});

		await drizzle.transaction(async (trx) => {
			await trx.update(dogs).set(data).where(eq(dogs.id, id));

			//
			// ## Session History
			//
			if (sessionsActionsLog.inserts.length > 0) {
				await trx.insert(dogSessions).values(sessionsActionsLog.inserts);
			}

			if (sessionsActionsLog.updates.length > 0) {
				for (const updatedSessionHistory of sessionsActionsLog.updates) {
					await trx.update(dogSessions).set(updatedSessionHistory).where(eq(dogSessions.id, updatedSessionHistory.id));
				}
			}

			if (sessionsActionsLog.deletes.length > 0) {
				await trx.delete(dogSessions).where(inArray(dogSessions.id, sessionsActionsLog.deletes));
			}

			//
			// ## Client Relationship Actions
			//
			if (dogToClientRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(dogToClientRelationships).values(dogToClientRelationshipsActionsLog.inserts);
			}

			if (dogToClientRelationshipsActionsLog.updates.length > 0) {
				for (const updatedClientRelationship of dogToClientRelationshipsActionsLog.updates) {
					await trx
						.update(dogToClientRelationships)
						.set(updatedClientRelationship)
						.where(eq(dogToClientRelationships.id, updatedClientRelationship.id));
				}
			}

			if (dogToClientRelationshipsActionsLog.deletes.length > 0) {
				await trx
					.delete(dogToClientRelationships)
					.where(inArray(dogToClientRelationships.id, dogToClientRelationshipsActionsLog.deletes));
			}

			//
			// ## Vet Relationship Actions
			//
			if (dogToVetRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(dogToVetRelationships).values(dogToVetRelationshipsActionsLog.inserts);
			}

			if (dogToVetRelationshipsActionsLog.updates.length > 0) {
				for (const updatedClientRelationship of dogToVetRelationshipsActionsLog.updates) {
					await trx
						.update(dogToVetRelationships)
						.set(updatedClientRelationship)
						.where(eq(dogToVetRelationships.id, updatedClientRelationship.id));
				}
			}

			if (dogToVetRelationshipsActionsLog.deletes.length > 0) {
				await trx
					.delete(dogToVetRelationships)
					.where(inArray(dogToVetRelationships.id, dogToVetRelationshipsActionsLog.deletes));
			}
		});

		revalidatePath("/dogs");
		revalidatePath("/dogs/[id]");

		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false, error: `Failed to update dog with id: ${validValues.data.id}` };
	}
});
type DogUpdate = ExtractServerActionData<typeof updateDog>;

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
				sessions: true,
				dogToClientRelationships: true,
				dogToVetRelationships: true,
			},
		});

		if (dog) {
			await drizzle.transaction(async (trx) => {
				await trx.delete(dogs).where(eq(dogs.id, id));

				if (dog.sessions.length > 0) {
					await trx.delete(dogSessions).where(
						inArray(
							dogSessions.id,
							dog.sessions.map((s) => s.id),
						),
					);
				}

				if (dog.dogToClientRelationships.length > 0) {
					await trx.delete(dogToClientRelationships).where(
						inArray(
							dogToClientRelationships.id,
							dog.dogToClientRelationships.map((c) => c.id),
						),
					);
				}

				if (dog.dogToVetRelationships.length > 0) {
					await trx.delete(dogToVetRelationships).where(
						inArray(
							dogToVetRelationships.id,
							dog.dogToVetRelationships.map((v) => v.id),
						),
					);
				}
			});
		}

		revalidatePath("/dogs");

		return { success: true, data: validId.data };
	} catch (error) {
		console.log(error);
		return { success: false, error: `Failed to fetch dog with id: ${id}` };
	}
});
type DogDelete = ExtractServerActionData<typeof deleteDog>;

export {
	listDogs,
	type DogsList,
	searchDogs,
	type DogsSearch,
	getDogById,
	type DogById,
	insertDog,
	type DogInsert,
	updateDog,
	type DogUpdate,
	deleteDog,
	type DogDelete,
};
