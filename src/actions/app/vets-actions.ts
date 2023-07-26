"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { dogToVetRelationships, vets, vetToVetClinicRelationships } from "~/db/schemas";
import { InsertVetSchema, UpdateVetSchema } from "~/db/validation";
import {
	createServerAction,
	getUser,
	SearchTermSchema,
	separateActionsLogSchema,
	type ExtractServerActionData,
} from "../utils";

const listVets = createServerAction(async (limit?: number) => {
	try {
		const user = await getUser();

		const data = await drizzle.query.vets.findMany({
			limit: limit ?? 50,
			where: eq(vets.organizationId, user.organizationId),
			with: {
				dogToVetRelationships: {
					with: {
						dog: true,
					},
				},
				vetToVetClinicRelationships: {
					with: {
						vetClinic: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to list vets" };
	}
});
type VetsList = ExtractServerActionData<typeof listVets>;

const searchVets = createServerAction(async (searchTerm: string) => {
	const validSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!validSearchTerm.success) {
		return { success: false, error: validSearchTerm.error.issues };
	}

	try {
		const user = await getUser();

		const data = await drizzle.query.vets.findMany({
			where: and(
				eq(vets.organizationId, user.organizationId),
				sql`concat(${vets.givenName},' ', ${vets.familyName}) LIKE CONCAT('%', ${validSearchTerm.data}, '%')`,
			),
			limit: 50,
			with: {
				dogToVetRelationships: {
					with: {
						dog: true,
					},
				},
				vetToVetClinicRelationships: {
					with: {
						vetClinic: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to search vets" };
	}
});
type VetsSearch = ExtractServerActionData<typeof searchVets>;

const insertVet = createServerAction(async (values: InsertVetSchema) => {
	const validValues = InsertVetSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const user = await getUser();

		const { actions, ...data } = validValues.data;

		const dogToVetRelationshipsActionsLog = separateActionsLogSchema(
			actions.dogToVetRelationships,
			user.organizationId,
		);
		const vetToVetClinicRelationshipsActionsLog = separateActionsLogSchema(
			actions.vetToVetClinicRelationships,
			user.organizationId,
		);

		await drizzle.transaction(async (trx) => {
			await trx.insert(vets).values({
				...data,
				organizationId: user.organizationId,
			});

			if (dogToVetRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(dogToVetRelationships).values(dogToVetRelationshipsActionsLog.inserts);
			}

			if (vetToVetClinicRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(vetToVetClinicRelationships).values(vetToVetClinicRelationshipsActionsLog.inserts);
			}
		});

		revalidatePath("/vets");

		const vet = await drizzle.query.vets.findFirst({
			where: and(eq(vets.organizationId, user.organizationId), eq(vets.givenName, data.givenName)),
			with: {
				dogToVetRelationships: {
					with: {
						dog: true,
					},
				},
				vetToVetClinicRelationships: {
					with: {
						vetClinic: true,
					},
				},
			},
		});

		return { success: true, data: vet };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to insert vet" };
	}
});
type VetInsert = ExtractServerActionData<typeof insertVet>;

const updateVet = createServerAction(async (values: UpdateVetSchema) => {
	const validValues = UpdateVetSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const user = await getUser();

		const { id, actions, ...data } = validValues.data;

		const dogToVetRelationshipsActionsLog = separateActionsLogSchema(
			actions?.dogToVetRelationships ?? {},
			user.organizationId,
		);
		const vetToVetClinicRelationshipsActionsLog = separateActionsLogSchema(
			actions?.vetToVetClinicRelationships ?? {},
			user.organizationId,
		);

		await drizzle.transaction(async (trx) => {
			await trx
				.update(vets)
				.set(data)
				.where(and(eq(vets.organizationId, user.organizationId), eq(vets.id, id)));

			//
			// ## Dog Relationship Actions
			//
			if (dogToVetRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(dogToVetRelationships).values(dogToVetRelationshipsActionsLog.inserts);
			}

			if (dogToVetRelationshipsActionsLog.updates.length > 0) {
				for (const relationship of dogToVetRelationshipsActionsLog.updates) {
					await trx
						.update(dogToVetRelationships)
						.set(relationship)
						.where(
							and(
								eq(dogToVetRelationships.organizationId, user.organizationId),
								eq(dogToVetRelationships.id, relationship.id),
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

			//
			// ## Vet Clinic Relationship Actions
			//
			if (vetToVetClinicRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(vetToVetClinicRelationships).values(vetToVetClinicRelationshipsActionsLog.inserts);
			}

			if (vetToVetClinicRelationshipsActionsLog.updates.length > 0) {
				for (const relationship of vetToVetClinicRelationshipsActionsLog.updates) {
					await trx
						.update(vetToVetClinicRelationships)
						.set(relationship)
						.where(
							and(
								eq(vetToVetClinicRelationships.organizationId, user.organizationId),
								eq(vetToVetClinicRelationships.id, relationship.id),
							),
						);
				}
			}

			if (vetToVetClinicRelationshipsActionsLog.deletes.length > 0) {
				await trx
					.delete(vetToVetClinicRelationships)
					.where(
						and(
							eq(vetToVetClinicRelationships.organizationId, user.organizationId),
							inArray(vetToVetClinicRelationships.id, vetToVetClinicRelationshipsActionsLog.deletes),
						),
					);
			}
		});

		revalidatePath("/vets");
		revalidatePath("/dogs/[id]");

		const vet = await drizzle.query.vets.findFirst({
			where: and(eq(vets.organizationId, user.organizationId), eq(vets.id, id)),
			with: {
				dogToVetRelationships: {
					with: {
						dog: true,
					},
				},
				vetToVetClinicRelationships: {
					with: {
						vetClinic: true,
					},
				},
			},
		});

		return { success: true, data: vet };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to update vet" };
	}
});
type VetUpdate = ExtractServerActionData<typeof updateVet>;

const deleteVet = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues };
	}

	try {
		const user = await getUser();

		const vet = await drizzle.query.vets.findFirst({
			where: and(eq(vets.organizationId, user.organizationId), eq(vets.id, validId.data)),
			columns: {
				id: true,
			},
			with: {
				dogToVetRelationships: true,
				vetToVetClinicRelationships: true,
			},
		});

		if (vet) {
			await drizzle.transaction(async (trx) => {
				await trx.delete(vets).where(eq(vets.id, id));

				if (vet.dogToVetRelationships.length > 0) {
					await trx.delete(dogToVetRelationships).where(
						inArray(
							dogToVetRelationships.id,
							vet.dogToVetRelationships.map((c) => c.id),
						),
					);
				}

				if (vet.vetToVetClinicRelationships.length > 0) {
					await trx.delete(vetToVetClinicRelationships).where(
						inArray(
							vetToVetClinicRelationships.id,
							vet.vetToVetClinicRelationships.map((c) => c.id),
						),
					);
				}
			});
		}

		revalidatePath("/vets");

		return { success: true, data: validId.data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to delete vet" };
	}
});
type VetDelete = ExtractServerActionData<typeof deleteVet>;

const getVetRelationships = createServerAction(async (vetId: string) => {
	try {
		const user = await getUser();

		const dogToVetRelationshipsData = await drizzle.query.dogToVetRelationships.findMany({
			limit: 25,
			where: and(eq(dogToVetRelationships.organizationId, user.organizationId), eq(dogToVetRelationships.vetId, vetId)),
			with: {
				dog: true,
			},
		});

		const vetToVetClinicRelationshipsData = await drizzle.query.vetToVetClinicRelationships.findMany({
			limit: 25,
			where: eq(vetToVetClinicRelationships.vetId, vetId),
			with: {
				vetClinic: true,
			},
		});

		return {
			success: true,
			data: {
				dogToVetRelationships: dogToVetRelationshipsData,
				vetToVetClinicRelationships: vetToVetClinicRelationshipsData,
			},
		};
	} catch (error) {
		console.log(error);
		return { success: false, error: `Failed to get vet relationships with vet id: "${vetId}"` };
	}
});
type VetRelationships = ExtractServerActionData<typeof getVetRelationships>;

export {
	listVets,
	type VetsList,
	searchVets,
	type VetsSearch,
	insertVet,
	type VetInsert,
	updateVet,
	type VetUpdate,
	deleteVet,
	type VetDelete,
	getVetRelationships,
	type VetRelationships,
};
