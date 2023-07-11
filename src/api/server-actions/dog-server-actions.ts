"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs";
import { type User } from "@clerk/nextjs/dist/types/server";
import { eq, inArray, like } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { dogs, dogSessions, dogToClientRelationships, dogToVetRelationships } from "~/db/drizzle-schema";
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
		console.log(error);
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
		console.log(error);
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
						sessions: data?.sessions.map((session) => {
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
		console.log(error);
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

		const sessionsActionLog = separateActionLogSchema(actions.sessions);
		const dogToClientRelationshipsActionLog = separateActionLogSchema(actions.dogToClientRelationships);
		const dogToVetRelationshipsActionLog = separateActionLogSchema(actions.dogToVetRelationships);

		await drizzle.transaction(async (trx) => {
			await trx.insert(dogs).values(data);

			if (sessionsActionLog.inserts.length > 0) {
				await trx.insert(dogSessions).values(sessionsActionLog.inserts);
			}

			if (dogToClientRelationshipsActionLog.inserts.length > 0) {
				await trx.insert(dogToClientRelationships).values(dogToClientRelationshipsActionLog.inserts);
			}

			if (dogToVetRelationshipsActionLog.inserts.length > 0) {
				await trx.insert(dogToVetRelationships).values(dogToVetRelationshipsActionLog.inserts);
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

const updateDog = createServerAction(async (values: UpdateDogSchema) => {
	const validValues = UpdateDogSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const { id, actions, ...data } = validValues.data;

		const sessionsActionLog = separateActionLogSchema(actions?.sessions ?? {});
		const dogToClientRelationshipsActionLog = separateActionLogSchema(actions?.dogToClientRelationships ?? {});
		const dogToVetRelationshipsActionLog = separateActionLogSchema(actions?.dogToVetRelationships ?? {});

		await drizzle.transaction(async (trx) => {
			await trx.update(dogs).set(data).where(eq(dogs.id, id));

			//
			// ## Session History
			//
			if (sessionsActionLog.inserts.length > 0) {
				await trx.insert(dogSessions).values(sessionsActionLog.inserts);
			}

			if (sessionsActionLog.updates.length > 0) {
				for (const updatedSessionHistory of sessionsActionLog.updates) {
					await trx.update(dogSessions).set(updatedSessionHistory).where(eq(dogSessions.id, updatedSessionHistory.id));
				}
			}

			if (sessionsActionLog.deletes.length > 0) {
				await trx.delete(dogSessions).where(inArray(dogSessions.id, sessionsActionLog.deletes));
			}

			//
			// ## Client Relationship Actions
			//
			if (dogToClientRelationshipsActionLog.inserts.length > 0) {
				await trx.insert(dogToClientRelationships).values(dogToClientRelationshipsActionLog.inserts);
			}

			if (dogToClientRelationshipsActionLog.updates.length > 0) {
				for (const updatedClientRelationship of dogToClientRelationshipsActionLog.updates) {
					await trx
						.update(dogToClientRelationships)
						.set(updatedClientRelationship)
						.where(eq(dogToClientRelationships.id, updatedClientRelationship.id));
				}
			}

			if (dogToClientRelationshipsActionLog.deletes.length > 0) {
				await trx
					.delete(dogToClientRelationships)
					.where(inArray(dogToClientRelationships.id, dogToClientRelationshipsActionLog.deletes));
			}

			//
			// ## Vet Relationship Actions
			//
			if (dogToVetRelationshipsActionLog.inserts.length > 0) {
				await trx.insert(dogToVetRelationships).values(dogToVetRelationshipsActionLog.inserts);
			}

			if (dogToVetRelationshipsActionLog.updates.length > 0) {
				for (const updatedClientRelationship of dogToVetRelationshipsActionLog.updates) {
					await trx
						.update(dogToVetRelationships)
						.set(updatedClientRelationship)
						.where(eq(dogToVetRelationships.id, updatedClientRelationship.id));
				}
			}

			if (dogToVetRelationshipsActionLog.deletes.length > 0) {
				await trx
					.delete(dogToVetRelationships)
					.where(inArray(dogToVetRelationships.id, dogToVetRelationshipsActionLog.deletes));
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

export { listDogs, searchDogs, getDogById, insertDog, updateDog, deleteDog };
