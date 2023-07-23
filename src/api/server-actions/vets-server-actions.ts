"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/server/db/drizzle";
import { dogToVetRelationships, vets, vetToVetClinicRelationships } from "~/server/db/schemas";
import { createServerAction, type ExtractServerActionData } from "../utils";
import { SearchTermSchema, separateActionsLogSchema } from "../validations/utils";
import { InsertVetSchema, UpdateVetSchema } from "../validations/vets";

const listVets = createServerAction(async (limit?: number) => {
	try {
		const data = await drizzle.query.vets.findMany({
			limit: limit ?? 50,
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
		const data = await drizzle.query.vets.findMany({
			where: sql`concat(${vets.givenName},' ', ${vets.familyName}) LIKE CONCAT('%', ${validSearchTerm.data}, '%')`,
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
		const { actions, ...data } = validValues.data;

		const dogToVetRelationshipsActionsLog = separateActionsLogSchema(actions.dogToVetRelationships);
		const vetToVetClinicRelationshipsActionsLog = separateActionsLogSchema(actions.vetToVetClinicRelationships);

		await drizzle.transaction(async (trx) => {
			await trx.insert(vets).values(data);

			if (dogToVetRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(dogToVetRelationships).values(dogToVetRelationshipsActionsLog.inserts);
			}

			if (vetToVetClinicRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(vetToVetClinicRelationships).values(vetToVetClinicRelationshipsActionsLog.inserts);
			}
		});

		revalidatePath("/vets");

		const vet = await drizzle.query.vets.findFirst({
			where: eq(vets.id, data.id),
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
		const { id, actions, ...data } = validValues.data;

		const dogToVetRelationshipsActionsLog = separateActionsLogSchema(actions?.dogToVetRelationships ?? {});
		const vetToVetClinicRelationshipsActionsLog = separateActionsLogSchema(actions?.vetToVetClinicRelationships ?? {});

		await drizzle.transaction(async (trx) => {
			await trx.update(vets).set(data).where(eq(vets.id, id));

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
						.where(eq(dogToVetRelationships.id, relationship.id));
				}
			}

			if (dogToVetRelationshipsActionsLog.deletes.length > 0) {
				await trx
					.delete(dogToVetRelationships)
					.where(inArray(dogToVetRelationships.id, dogToVetRelationshipsActionsLog.deletes));
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
						.where(eq(vetToVetClinicRelationships.id, relationship.id));
				}
			}

			if (vetToVetClinicRelationshipsActionsLog.deletes.length > 0) {
				await trx
					.delete(vetToVetClinicRelationships)
					.where(inArray(vetToVetClinicRelationships.id, vetToVetClinicRelationshipsActionsLog.deletes));
			}
		});

		revalidatePath("/vets");
		revalidatePath("/dogs/[id]");

		const vet = await drizzle.query.vets.findFirst({
			where: eq(vets.id, id),
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
		const vet = await drizzle.query.vets.findFirst({
			where: eq(vets.id, validId.data),
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
};
