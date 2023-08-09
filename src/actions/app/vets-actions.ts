"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, like, or, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { dogToVetRelationships, vets, vetToVetClinicRelationships } from "~/db/schemas";
import { InsertVetSchema, UpdateVetSchema } from "~/db/validation";
import { VETS_SORTABLE_COLUMNS } from "../sortable-columns";
import {
	createServerAction,
	getServerUser,
	SearchTermSchema,
	separateActionsLogSchema,
	validatePaginationSearchParams,
	type ExtractServerActionData,
	type PaginationSearchParams,
} from "../utils";

const listVets = createServerAction(async (options: PaginationSearchParams) => {
	try {
		const user = await getServerUser();

		const countQuery = await drizzle
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(vets)
			.where(eq(vets.organizationId, user.organizationId));

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...options,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: VETS_SORTABLE_COLUMNS,
		});
		const data = await drizzle.query.vets.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: limit,
			offset: (page - 1) * limit,
			where: eq(vets.organizationId, user.organizationId),
			orderBy: (vets, { asc }) => (orderBy ? [...orderBy, asc(vets.id)] : [asc(vets.id)]),
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
			error: "Failed to list vets",
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
type VetsList = ExtractServerActionData<typeof listVets>;

const searchVets = createServerAction(async (searchTerm: string) => {
	const validSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!validSearchTerm.success) {
		return { success: false, error: validSearchTerm.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.vets.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: 50,
			where: and(
				eq(vets.organizationId, user.organizationId),
				or(
					sql`CONCAT(${vets.givenName},' ', ${vets.familyName}) LIKE CONCAT('%', ${validSearchTerm.data}, '%')`,
					like(vets.emailAddress, `%${validSearchTerm.data}%`),
					like(vets.phoneNumber, `%${validSearchTerm.data}%`),
				),
			),
			orderBy: (vets, { asc }) => [asc(vets.givenName), asc(vets.familyName), asc(vets.id)],
		});

		return { success: true, data };
	} catch {
		return { success: false, error: "Failed to search vets", data: null };
	}
});
type VetsSearch = ExtractServerActionData<typeof searchVets>;

const getVetById = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.vets.findFirst({
			where: and(eq(vets.organizationId, user.organizationId), eq(vets.id, validId.data)),
			with: {
				dogToVetRelationships: {
					with: {
						dog: {
							columns: {
								id: true,
								givenName: true,
								color: true,
								breed: true,
							},
						},
					},
				},
				vetToVetClinicRelationships: {
					with: {
						vetClinic: {
							columns: {
								id: true,
								name: true,
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
		return { success: false, error: `Failed to get vet with id ${validId.data}`, data: null };
	}
});
type VetById = ExtractServerActionData<typeof getVetById>;

const insertVet = createServerAction(async (values: InsertVetSchema) => {
	const validValues = InsertVetSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

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
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			where: and(eq(vets.organizationId, user.organizationId), eq(vets.givenName, data.givenName)),
		});

		return { success: true, data: vet };
	} catch {
		return { success: false, error: "Failed to insert vet", data: null };
	}
});
type VetInsert = ExtractServerActionData<typeof insertVet>;

const updateVet = createServerAction(async (values: UpdateVetSchema) => {
	const validValues = UpdateVetSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

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
		revalidatePath("/dog/[id]");

		const vet = await drizzle.query.vets.findFirst({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			where: and(eq(vets.organizationId, user.organizationId), eq(vets.id, id)),
		});

		return { success: true, data: vet };
	} catch {
		return { success: false, error: "Failed to update vet", data: null };
	}
});
type VetUpdate = ExtractServerActionData<typeof updateVet>;

const deleteVet = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

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
	} catch {
		return { success: false, error: "Failed to delete vet", data: null };
	}
});
type VetDelete = ExtractServerActionData<typeof deleteVet>;

export {
	listVets,
	type VetsList,
	searchVets,
	type VetsSearch,
	getVetById,
	type VetById,
	insertVet,
	type VetInsert,
	updateVet,
	type VetUpdate,
	deleteVet,
	type VetDelete,
};
