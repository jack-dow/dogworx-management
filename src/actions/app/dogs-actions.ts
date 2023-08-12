"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { dogs, dogSessions, dogToClientRelationships, dogToVetRelationships } from "~/db/schema";
import { InsertDogSchema, UpdateDogSchema } from "~/db/validation";
import { DOGS_SORTABLE_COLUMNS } from "../sortable-columns";
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

const listDogs = createServerAction(async (options: PaginationSearchParams) => {
	try {
		const user = await getServerUser();

		const countQuery = await drizzle
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(dogs)
			.where(eq(dogs.organizationId, user.organizationId));

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...options,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: DOGS_SORTABLE_COLUMNS,
		});

		const data = await drizzle.query.dogs.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				breed: true,
				color: true,
			},
			limit: limit,
			offset: (page - 1) * limit,
			where: eq(dogs.organizationId, user.organizationId),
			orderBy: (dogs, { asc }) => (orderBy ? [...orderBy, asc(dogs.id)] : [asc(dogs.id)]),
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
			error: "Failed to list dogs",
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
type DogsList = ExtractServerActionData<typeof listDogs>;

const searchDogs = createServerAction(async (searchTerm: string) => {
	const validation = SearchTermSchema.safeParse(searchTerm);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const names = validation.data.split(" ");
		let givenName = names[0];
		if (names.length > 0) {
			givenName = names.shift();
		}
		const familyName = names.join(" ");

		const data = await drizzle.query.dogs.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				breed: true,
				color: true,
			},
			limit: 20,
			where: and(
				eq(dogs.organizationId, user.organizationId),
				or(like(dogs.givenName, `%${givenName}%`), like(dogs.familyName, `%${familyName || givenName}%`)),
			),
			orderBy: (dogs, { asc }) => [asc(dogs.givenName), asc(dogs.id)],
		});

		return { success: true, data };
	} catch {
		return { success: false, error: "Failed to search dogs", data: null };
	}
});
type DogsSearch = ExtractServerActionData<typeof searchDogs>;

const getDogById = createServerAction(async (id: string) => {
	const validation = z.string().safeParse(id);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.dogs.findFirst({
			where: and(eq(dogs.organizationId, user.organizationId), eq(dogs.id, validation.data)),
			with: {
				dogSessions: {
					limit: 4,
					orderBy: (dogSessions, { asc }) => [desc(dogSessions.date), asc(dogSessions.id)],
					with: {
						user: {
							columns: {
								id: true,
								givenName: true,
								familyName: true,
								emailAddress: true,
								organizationId: true,
								organizationRole: true,
								profileImageUrl: true,
							},
						},
					},
				},
				dogToClientRelationships: {
					with: {
						client: {
							columns: {
								id: true,
								givenName: true,
								familyName: true,
								emailAddress: true,
								phoneNumber: true,
							},
						},
					},
				},
				dogToVetRelationships: {
					with: {
						vet: {
							columns: {
								id: true,
								givenName: true,
								familyName: true,
								emailAddress: true,
								phoneNumber: true,
							},
						},
					},
				},
			},
		});

		return { success: true, data };
	} catch {
		return { success: false, error: `Failed to fetch dog with id: ${validation.data}`, data: null };
	}
});
type DogById = ExtractServerActionData<typeof getDogById>;

const insertDog = createServerAction(async (values: InsertDogSchema) => {
	const validation = InsertDogSchema.safeParse(values);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const { actions, dogToClientRelationships: dogToClientRelationshipsArray, ...data } = validation.data;

		const sessionsActionsLog = separateActionsLogSchema(actions.dogSessions, user.organizationId);
		const dogToClientRelationshipsActionsLog = separateActionsLogSchema(
			actions.dogToClientRelationships,
			user.organizationId,
		);
		const dogToVetRelationshipsActionsLog = separateActionsLogSchema(
			actions.dogToVetRelationships,
			user.organizationId,
		);

		await drizzle.transaction(async (trx) => {
			await trx.insert(dogs).values({
				...data,
				familyName: constructFamilyName(dogToClientRelationshipsArray),
				organizationId: user.organizationId,
			});

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
		revalidatePath("/dog/[id]");

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: `Failed to insert dog with id: ${validation.data.id}`, data: null };
	}
});
type DogInsert = ExtractServerActionData<typeof insertDog>;

const updateDog = createServerAction(async (values: UpdateDogSchema) => {
	const validValues = UpdateDogSchema.safeParse(values);

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
		const dogToVetRelationshipsActionsLog = separateActionsLogSchema(
			actions?.dogToVetRelationships ?? {},
			user.organizationId,
		);

		if (dogToClientRelationshipsArray) {
			data.familyName = constructFamilyName(dogToClientRelationshipsArray);
		}

		await drizzle.transaction(async (trx) => {
			await trx
				.update(dogs)
				.set(data)
				.where(and(eq(dogs.organizationId, user.organizationId), eq(dogs.id, id)));

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
						.where(
							and(
								eq(dogToClientRelationships.organizationId, user.organizationId),
								eq(dogToClientRelationships.id, updatedClientRelationship.id),
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
						.where(
							and(
								eq(dogToVetRelationships.organizationId, user.organizationId),
								eq(dogToVetRelationships.id, updatedClientRelationship.id),
							),
						);
				}
			}

			if (dogToVetRelationshipsActionsLog.deletes.length > 0) {
				await trx
					.delete(dogToVetRelationships)
					.where(
						and(
							eq(dogToVetRelationships.organizationId, user.organizationId),
							inArray(dogToVetRelationships.id, dogToVetRelationshipsActionsLog.deletes),
						),
					);
			}
		});

		revalidatePath("/dogs");
		revalidatePath("/dog/[id]");

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: `Failed to update dog with id: ${validValues.data.id}`, data: null };
	}
});
type DogUpdate = ExtractServerActionData<typeof updateDog>;

const deleteDog = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const dog = await drizzle.query.dogs.findFirst({
			where: and(eq(dogs.organizationId, user.organizationId), eq(dogs.id, validId.data)),
			columns: {
				id: true,
			},
			with: {
				dogSessions: true,
				dogToClientRelationships: true,
				dogToVetRelationships: true,
			},
		});

		if (dog) {
			await drizzle.transaction(async (trx) => {
				await trx.delete(dogs).where(eq(dogs.id, id));

				if (dog.dogSessions.length > 0) {
					await trx.delete(dogSessions).where(
						inArray(
							dogSessions.id,
							dog.dogSessions.map((s) => s.id),
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
	} catch {
		return { success: false, error: `Failed to delete dog with id: ${id}`, data: null };
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
