import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { vetClinics, vetToVetClinicRelationships as vetToVetClinicRelationshipsTable } from "~/db/schema/app";
import {
	InsertVetClinicSchema,
	InsertVetToVetClinicRelationshipSchema,
	UpdateVetClinicSchema,
	UpdateVetToVetClinicRelationshipSchema,
} from "~/db/validation/app";
import { PaginationOptionsSchema, validatePaginationSearchParams, type SortableColumns } from "~/server/utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

const VET_CLINICS_SORTABLE_COLUMNS = {
	name: {
		id: "name",
		label: "Name",
		columns: [vetClinics.name],
	},
	emailAddress: {
		id: "emailAddress",
		label: "Email address",
		columns: [vetClinics.emailAddress],
	},
	phoneNumber: {
		id: "phoneNumber",
		label: "Phone number",
		columns: [vetClinics.phoneNumber],
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
		columns: [vetClinics.createdAt],
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
		columns: [vetClinics.updatedAt],
	},
} satisfies SortableColumns;

export const vetClinicsRouter = createTRPCRouter({
	all: protectedProcedure.input(PaginationOptionsSchema).query(async ({ ctx, input }) => {
		const countQuery = await ctx.db
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(vetClinics)
			.where(eq(vetClinics.organizationId, ctx.user.organizationId));

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...input,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: VET_CLINICS_SORTABLE_COLUMNS,
		});

		const data = await ctx.db.query.vetClinics.findMany({
			columns: {
				id: true,
				name: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: limit,
			offset: (page - 1) * limit,
			where: eq(vetClinics.organizationId, ctx.user.organizationId),
			orderBy: (vetClinics, { asc }) => (orderBy ? [...orderBy, asc(vetClinics.id)] : [asc(vetClinics.id)]),
		});

		return {
			pagination: {
				count,
				page,
				maxPage,
				limit,
				sortBy,
				sortDirection,
			},
			data,
		};
	}),

	search: protectedProcedure.input(z.object({ searchTerm: z.string() })).query(async ({ ctx, input }) => {
		const data = await ctx.db.query.vetClinics.findMany({
			columns: {
				id: true,
				name: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: 20,
			where: (vetClinics, { and, eq, like, or }) =>
				and(
					eq(vetClinics.organizationId, ctx.user.organizationId),
					or(
						like(vetClinics.name, `%${input.searchTerm ?? ""}%`),
						like(vetClinics.emailAddress, `%${input.searchTerm ?? ""}%`),
						like(vetClinics.phoneNumber, `%${input.searchTerm ?? ""}%`),
					),
				),
			orderBy: (vetClinics, { asc }) => [asc(vetClinics.name), asc(vetClinics.id)],
		});

		return { data };
	}),

	byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const data = await ctx.db.query.vetClinics.findFirst({
			where: (vetClinics, { and, eq }) =>
				and(eq(vetClinics.organizationId, ctx.user.organizationId), eq(vetClinics.id, input.id)),
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

		return { data };
	}),

	insert: protectedProcedure.input(InsertVetClinicSchema).mutation(async ({ ctx, input }) => {
		const { vetToVetClinicRelationships, ...data } = input;

		await ctx.db.transaction(async (trx) => {
			await trx.insert(vetClinics).values({
				...data,
				organizationId: ctx.user.organizationId,
			});
			if (vetToVetClinicRelationships && vetToVetClinicRelationships.length > 0) {
				const vetToVetClinicRelationshipsArray = vetToVetClinicRelationships.map((relationship) => ({
					...relationship,
					organizationId: ctx.user.organizationId,
				}));

				await trx.insert(vetToVetClinicRelationshipsTable).values(vetToVetClinicRelationshipsArray);
			}
		});

		const vetClinic = await ctx.db.query.vetClinics.findFirst({
			where: (vetClinics, { and, eq }) =>
				and(eq(vetClinics.organizationId, ctx.user.organizationId), eq(vetClinics.id, data.id)),
			columns: {
				id: true,
				name: true,
				emailAddress: true,
				phoneNumber: true,
			},
		});

		return { data: vetClinic };
	}),

	update: protectedProcedure.input(UpdateVetClinicSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;

		await ctx.db
			.update(vetClinics)
			.set(data)
			.where(and(eq(vetClinics.organizationId, ctx.user.organizationId), eq(vetClinics.id, id)));

		const vetClinic = await ctx.db.query.vetClinics.findFirst({
			columns: {
				id: true,
				name: true,
				emailAddress: true,
				phoneNumber: true,
			},
			where: and(eq(vetClinics.organizationId, ctx.user.organizationId), eq(vetClinics.id, id)),
		});

		return { data: vetClinic };
	}),

	vetToVetClinicRelationships: createTRPCRouter({
		insert: protectedProcedure.input(InsertVetToVetClinicRelationshipSchema).mutation(async ({ ctx, input }) => {
			await ctx.db.insert(vetToVetClinicRelationshipsTable).values({
				...input,
				organizationId: ctx.user.organizationId,
			});
		}),

		update: protectedProcedure.input(UpdateVetToVetClinicRelationshipSchema).mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			await ctx.db
				.update(vetToVetClinicRelationshipsTable)
				.set(data)
				.where(
					and(
						eq(vetToVetClinicRelationshipsTable.organizationId, ctx.user.organizationId),
						eq(vetToVetClinicRelationshipsTable.id, id),
					),
				);
		}),

		delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(vetToVetClinicRelationshipsTable)
				.where(
					and(
						eq(vetToVetClinicRelationshipsTable.organizationId, ctx.user.organizationId),
						eq(vetToVetClinicRelationshipsTable.id, input.id),
					),
				);
		}),
	}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		await ctx.db.transaction(async (trx) => {
			await trx
				.delete(vetClinics)
				.where(and(eq(vetClinics.organizationId, ctx.user.organizationId), eq(vetClinics.id, input.id)));

			await trx
				.delete(vetToVetClinicRelationshipsTable)
				.where(
					and(
						eq(vetToVetClinicRelationshipsTable.organizationId, ctx.user.organizationId),
						eq(vetToVetClinicRelationshipsTable.vetClinicId, input.id),
					),
				);
		});
	}),
});
