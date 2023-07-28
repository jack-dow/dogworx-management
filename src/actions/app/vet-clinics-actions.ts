"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, like } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { vetClinics, vetToVetClinicRelationships } from "~/db/schemas";
import { InsertVetClinicSchema, UpdateVetClinicSchema } from "~/db/validation";
import {
	createServerAction,
	getServerUser,
	SearchTermSchema,
	separateActionsLogSchema,
	type ExtractServerActionData,
} from "../utils";

const listVetClinics = createServerAction(async (limit?: number) => {
	try {
		const user = await getServerUser();

		const data = await drizzle.query.vetClinics.findMany({
			limit: limit ?? 50,
			where: eq(vetClinics.organizationId, user.organizationId),
			orderBy: (vetClinics, { asc }) => [asc(vetClinics.name)],
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
		const user = await getServerUser();

		const data = await drizzle.query.vetClinics.findMany({
			limit: 50,
			where: and(
				eq(vetClinics.organizationId, user.organizationId),
				like(vetClinics.name, `%${validSearchTerm.data ?? ""}%`),
			),
			orderBy: (vetClinics, { asc }) => [asc(vetClinics.name)],
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
		const user = await getServerUser();

		const { actions, ...data } = validValues.data;

		const vetToVetClinicRelationshipsActionsLog = separateActionsLogSchema(
			actions.vetToVetClinicRelationships,
			user.organizationId,
		);

		await drizzle.transaction(async (trx) => {
			await trx.insert(vetClinics).values({
				...data,
				organizationId: user.organizationId,
			});
			if (vetToVetClinicRelationshipsActionsLog.inserts.length > 0) {
				await trx.insert(vetToVetClinicRelationships).values(vetToVetClinicRelationshipsActionsLog.inserts);
			}
		});

		revalidatePath("/vetClinics");

		const vetClinic = await drizzle.query.vetClinics.findFirst({
			where: and(eq(vetClinics.organizationId, user.organizationId), eq(vetClinics.id, data.id)),
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
		const user = await getServerUser();

		const { id, actions, ...data } = validValues.data;

		const vetToVetClinicRelationshipsActionsLog = separateActionsLogSchema(
			actions?.vetToVetClinicRelationships ?? {},
			user.organizationId,
		);

		await drizzle.transaction(async (trx) => {
			await trx
				.update(vetClinics)
				.set(data)
				.where(and(eq(vetClinics.organizationId, user.organizationId), eq(vetClinics.id, id)));

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

		revalidatePath("/vetClinics");

		const vetClinic = await drizzle.query.vetClinics.findFirst({
			where: and(eq(vetClinics.organizationId, user.organizationId), eq(vetClinics.id, id)),
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
		const user = await getServerUser();

		const vetClinic = await drizzle.query.vetClinics.findFirst({
			where: and(eq(vetClinics.organizationId, user.organizationId), eq(vetClinics.id, validId.data)),
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

const getVetClinicRelationships = createServerAction(async (vetClinicId: string) => {
	try {
		const user = await getServerUser();

		const vetToVetClinicRelationshipsData = await drizzle.query.vetToVetClinicRelationships.findMany({
			limit: 25,
			where: and(
				eq(vetToVetClinicRelationships.organizationId, user.organizationId),
				eq(vetToVetClinicRelationships.vetId, vetClinicId),
			),
			with: {
				vet: true,
			},
		});

		return {
			success: true,
			data: {
				vetToVetClinicRelationships: vetToVetClinicRelationshipsData,
			},
		};
	} catch (error) {
		console.log(error);
		return { success: false, error: `Failed to get vet clinic relationships with vet clinic id: "${vetClinicId}"` };
	}
});
type VetClinicRelationships = ExtractServerActionData<typeof getVetClinicRelationships>;

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
	getVetClinicRelationships,
	type VetClinicRelationships,
};
