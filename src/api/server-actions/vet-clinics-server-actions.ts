"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray, like } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/server/db/drizzle";
import { vetClinics, vetToVetClinicRelationships } from "~/server/db/schemas";
import { createServerAction, type ExtractServerActionData } from "../utils";
import { SearchTermSchema, separateActionsLogSchema } from "../validations/utils";
import { InsertVetClinicSchema, UpdateVetClinicSchema } from "../validations/vet-clinics";

const listVetClinics = createServerAction(async (limit?: number) => {
	try {
		const data = await drizzle.query.vetClinics.findMany({
			limit: limit ?? 50,
			with: {
				vetToVetClinicRelationships: {
					with: {
						vet: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to list vetClinics" };
	}
});
type VetClinicsList = ExtractServerActionData<typeof listVetClinics>;

const searchVetClinics = createServerAction(async (searchTerm: string) => {
	const validSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!validSearchTerm.success) {
		return { success: false, error: validSearchTerm.error.issues };
	}

	try {
		const data = await drizzle.query.vetClinics.findMany({
			where: like(vetClinics.name, `%${validSearchTerm.data ?? ""}%`),
			limit: 50,
			with: {
				vetToVetClinicRelationships: {
					with: {
						vet: true,
					},
				},
			},
		});

		return { success: true, data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to search vetClinics" };
	}
});
type VetClinicsSearch = ExtractServerActionData<typeof searchVetClinics>;

const insertVetClinic = createServerAction(async (values: InsertVetClinicSchema) => {
	const validValues = InsertVetClinicSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const { actions, ...data } = validValues.data;

		const vetToVetClinicRelationshipsActionsLog = separateActionsLogSchema(actions.vetToVetClinicRelationships);

		await drizzle.transaction(async (trx) => {
			await trx.insert(vetClinics).values(data);
			if (vetToVetClinicRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(vetToVetClinicRelationships).values(vetToVetClinicRelationshipsActionsLog.inserts);
			}
		});

		revalidatePath("/vetClinics");

		const vetClinic = await drizzle.query.vetClinics.findFirst({
			where: eq(vetClinics.id, data.id),
			with: {
				vetToVetClinicRelationships: {
					with: {
						vet: true,
					},
				},
			},
		});

		return { success: true, data: vetClinic };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to insert vetClinic" };
	}
});
type VetClinicInsert = ExtractServerActionData<typeof insertVetClinic>;

const updateVetClinic = createServerAction(async (values: UpdateVetClinicSchema) => {
	const validValues = UpdateVetClinicSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues };
	}

	try {
		const { id, actions, ...data } = validValues.data;

		const vetToVetClinicRelationshipsActionsLog = separateActionsLogSchema(actions?.vetToVetClinicRelationships ?? {});

		await drizzle.transaction(async (trx) => {
			await trx.update(vetClinics).set(data).where(eq(vetClinics.id, id));

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

		revalidatePath("/vetClinics");

		const vetClinic = await drizzle.query.vetClinics.findFirst({
			where: eq(vetClinics.id, id),
			with: {
				vetToVetClinicRelationships: {
					with: {
						vet: true,
					},
				},
			},
		});

		return { success: true, data: vetClinic };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to update vetClinic" };
	}
});
type VetClinicUpdate = ExtractServerActionData<typeof updateVetClinic>;

const deleteVetClinic = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues };
	}

	try {
		const vetClinic = await drizzle.query.vetClinics.findFirst({
			where: eq(vetClinics.id, validId.data),
			columns: {
				id: true,
			},
			with: {
				vetToVetClinicRelationships: true,
			},
		});

		if (vetClinic) {
			await drizzle.transaction(async (trx) => {
				await trx.delete(vetClinics).where(eq(vetClinics.id, id));

				if (vetClinic.vetToVetClinicRelationships.length > 0) {
					await trx.delete(vetToVetClinicRelationships).where(
						inArray(
							vetToVetClinicRelationships.id,
							vetClinic.vetToVetClinicRelationships.map((c) => c.id),
						),
					);
				}
			});
		}

		revalidatePath("/vetClinics");

		return { success: true, data: validId.data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to delete vetClinic" };
	}
});
type VetClinicDelete = ExtractServerActionData<typeof deleteVetClinic>;

export {
	listVetClinics,
	type VetClinicsList,
	searchVetClinics,
	type VetClinicsSearch,
	insertVetClinic,
	type VetClinicInsert,
	updateVetClinic,
	type VetClinicUpdate,
	deleteVetClinic,
	type VetClinicDelete,
};
