import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import {
	dogToVetRelationships as dogToVetRelationshipsTable,
	vets,
	vetToVetClinicRelationships as vetToVetClinicRelationshipsTable,
} from "~/db/schema/app";
import {
	InsertDogToVetRelationshipSchema,
	InsertVetSchema,
	InsertVetToVetClinicRelationshipSchema,
	UpdateDogToVetRelationshipSchema,
	UpdateVetSchema,
	UpdateVetToVetClinicRelationshipSchema,
} from "~/db/validation/app";
import { PaginationOptionsSchema, validatePaginationSearchParams } from "~/server/utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { VETS_SORTABLE_COLUMNS } from "../sortable-columns";

export const vetsRouter = createTRPCRouter({
	all: protectedProcedure.input(PaginationOptionsSchema).query(async ({ ctx, input }) => {
		const countQuery = await ctx.db
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(vets)
			.where(eq(vets.organizationId, ctx.user.organizationId));

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...input,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: VETS_SORTABLE_COLUMNS,
		});
		const data = await ctx.db.query.vets.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: limit,
			offset: (page - 1) * limit,
			where: eq(vets.organizationId, ctx.user.organizationId),
			orderBy: (vets, { asc }) => (orderBy ? [...orderBy, asc(vets.id)] : [asc(vets.id)]),
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
		const data = await ctx.db.query.vets.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: 20,
			where: (vets, { and, eq, or, like }) =>
				and(
					eq(vets.organizationId, ctx.user.organizationId),
					or(
						sql`CONCAT(${vets.givenName},' ', ${vets.familyName}) LIKE CONCAT('%', ${input.searchTerm}, '%')`,
						like(vets.emailAddress, `%${input.searchTerm}%`),
						like(vets.phoneNumber, `%${input.searchTerm}%`),
					),
				),
			orderBy: (vets, { asc }) => [asc(vets.givenName), asc(vets.familyName), asc(vets.id)],
		});

		return { data };
	}),

	byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const data = await ctx.db.query.vets.findFirst({
			where: (vets, { and, eq }) => and(eq(vets.organizationId, ctx.user.organizationId), eq(vets.id, input.id)),
			with: {
				dogToVetRelationships: {
					with: {
						dog: {
							columns: {
								id: true,
								givenName: true,
								familyName: true,
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

		return { data };
	}),

	insert: protectedProcedure.input(InsertVetSchema).mutation(async ({ ctx, input }) => {
		const { dogToVetRelationships, vetToVetClinicRelationships, ...data } = input;

		await ctx.db.transaction(async (trx) => {
			await trx.insert(vets).values({
				...data,
				organizationId: ctx.user.organizationId,
			});

			if (dogToVetRelationships && dogToVetRelationships.length > 0) {
				const dogToVetRelationshipsArray = dogToVetRelationships.map((relationship) => ({
					...relationship,
					organizationId: ctx.user.organizationId,
				}));

				await trx.insert(dogToVetRelationshipsTable).values(dogToVetRelationshipsArray);
			}

			if (vetToVetClinicRelationships && vetToVetClinicRelationships.length > 0) {
				const vetToVetClinicRelationshipsArray = vetToVetClinicRelationships.map((relationship) => ({
					...relationship,
					organizationId: ctx.user.organizationId,
				}));

				await trx.insert(vetToVetClinicRelationshipsTable).values(vetToVetClinicRelationshipsArray);
			}
		});

		const vet = await ctx.db.query.vets.findFirst({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			where: (vets, { and, eq }) =>
				and(eq(vets.organizationId, ctx.user.organizationId), eq(vets.givenName, data.givenName)),
		});

		return { data: vet };
	}),

	update: protectedProcedure.input(UpdateVetSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;

		await ctx.db
			.update(vets)
			.set(data)
			.where(and(eq(vets.organizationId, ctx.user.organizationId), eq(vets.id, id)));

		const vet = await ctx.db.query.vets.findFirst({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			where: and(eq(vets.organizationId, ctx.user.organizationId), eq(vets.id, id)),
		});

		return { data: vet };
	}),

	dogToVetRelationships: createTRPCRouter({
		insert: protectedProcedure.input(InsertDogToVetRelationshipSchema).mutation(async ({ ctx, input }) => {
			await ctx.db.insert(dogToVetRelationshipsTable).values({
				...input,
				organizationId: ctx.user.organizationId,
			});
		}),

		update: protectedProcedure.input(UpdateDogToVetRelationshipSchema).mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			await ctx.db
				.update(dogToVetRelationshipsTable)
				.set(data)
				.where(
					and(
						eq(dogToVetRelationshipsTable.organizationId, ctx.user.organizationId),
						eq(dogToVetRelationshipsTable.id, id),
					),
				);
		}),

		delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(dogToVetRelationshipsTable)
				.where(
					and(
						eq(dogToVetRelationshipsTable.organizationId, ctx.user.organizationId),
						eq(dogToVetRelationshipsTable.id, input.id),
					),
				);
		}),
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
			await trx.delete(vets).where(and(eq(vets.organizationId, ctx.user.organizationId), eq(vets.id, input.id)));

			await trx
				.delete(dogToVetRelationshipsTable)
				.where(
					and(
						eq(dogToVetRelationshipsTable.organizationId, ctx.user.organizationId),
						eq(dogToVetRelationshipsTable.vetId, input.id),
					),
				);

			await trx
				.delete(vetToVetClinicRelationshipsTable)
				.where(
					and(
						eq(vetToVetClinicRelationshipsTable.organizationId, ctx.user.organizationId),
						eq(vetToVetClinicRelationshipsTable.vetId, input.id),
					),
				);
		});
	}),
});
