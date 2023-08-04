"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, like, or, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { vetClinics, vetToVetClinicRelationships } from "~/db/schemas";
import { InsertVetClinicSchema, UpdateVetClinicSchema } from "~/db/validation";
import { VET_CLINICS_SORTABLE_COLUMNS } from "../sortable-columns";
import {
	createServerAction,
	getServerUser,
	SearchTermSchema,
	separateActionsLogSchema,
	validatePaginationSearchParams,
	type ExtractServerActionData,
	type PaginationSearchParams,
} from "../utils";

const listVetClinics = createServerAction(async (options: PaginationSearchParams) => {
	try {
		const user = await getServerUser();

		const countQuery = await drizzle
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(vetClinics)
			.where(eq(vetClinics.organizationId, user.organizationId));

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...options,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: VET_CLINICS_SORTABLE_COLUMNS,
		});

		const data = await drizzle.query.vetClinics.findMany({
			columns: {
				id: true,
				name: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: limit,
			offset: (page - 1) * limit,
			where: eq(vetClinics.organizationId, user.organizationId),
			orderBy: (vetClinics, { asc }) => (orderBy ? [...orderBy, asc(vetClinics.id)] : [asc(vetClinics.id)]),
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
			error: "Failed to list vetClinics",
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
type VetClinicsList = ExtractServerActionData<typeof listVetClinics>;

const searchVetClinics = createServerAction(async (searchTerm: string) => {
	const validSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!validSearchTerm.success) {
		return { success: false, error: validSearchTerm.error.issues, data: [] };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.vetClinics.findMany({
			columns: {
				id: true,
				name: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: 50,
			where: and(
				eq(vetClinics.organizationId, user.organizationId),
				or(
					like(vetClinics.name, `%${validSearchTerm.data ?? ""}%`),
					like(vetClinics.emailAddress, `%${validSearchTerm.data ?? ""}%`),
					like(vetClinics.phoneNumber, `%${validSearchTerm.data ?? ""}%`),
				),
			),
			orderBy: (vetClinics, { asc }) => [asc(vetClinics.name), asc(vetClinics.id)],
		});

		return { success: true, data };
	} catch {
		return { success: false, error: "Failed to search vetClinics", data: [] };
	}
});
type VetClinicsSearch = ExtractServerActionData<typeof searchVetClinics>;

const getVetClinicById = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.vetClinics.findFirst({
			where: and(eq(vetClinics.organizationId, user.organizationId), eq(vetClinics.id, validId.data)),
			with: {
				vetToVetClinicRelationships: {
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
		return { success: false, error: `Failed to get vet clinic with id ${validId.data}`, data: null };
	}
});
type VetClinicById = ExtractServerActionData<typeof getVetClinicById>;

const insertVetClinic = createServerAction(async (values: InsertVetClinicSchema) => {
	const validValues = InsertVetClinicSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues, data: null };
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
			columns: {
				id: true,
				name: true,
				emailAddress: true,
				phoneNumber: true,
			},
		});

		return { success: true, data: vetClinic };
	} catch {
		return { success: false, error: "Failed to insert vet clinic", data: null };
	}
});
type VetClinicInsert = ExtractServerActionData<typeof insertVetClinic>;

const updateVetClinic = createServerAction(async (values: UpdateVetClinicSchema) => {
	const validValues = UpdateVetClinicSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues, data: null };
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
			columns: {
				id: true,
				name: true,
				emailAddress: true,
				phoneNumber: true,
			},
			where: and(eq(vetClinics.organizationId, user.organizationId), eq(vetClinics.id, id)),
		});

		return { success: true, data: vetClinic };
	} catch {
		return { success: false, error: "Failed to update vet clinic", data: null };
	}
});
type VetClinicUpdate = ExtractServerActionData<typeof updateVetClinic>;

const deleteVetClinic = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
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
	} catch {
		return { success: false, error: "Failed to delete vet clinic", data: null };
	}
});
type VetClinicDelete = ExtractServerActionData<typeof deleteVetClinic>;

export {
	listVetClinics,
	type VetClinicsList,
	searchVetClinics,
	type VetClinicsSearch,
	getVetClinicById,
	type VetClinicById,
	insertVetClinic,
	type VetClinicInsert,
	updateVetClinic,
	type VetClinicUpdate,
	deleteVetClinic,
	type VetClinicDelete,
};
