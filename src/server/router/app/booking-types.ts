import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { bookingTypes } from "~/db/schema/app";
import { InsertBookingTypeSchema, UpdateBookingTypeSchema } from "~/db/validation/app";
import { PaginationOptionsSchema, validatePaginationSearchParams } from "~/server/utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { BOOKING_TYPES_SORTABLE_COLUMNS } from "../sortable-columns";

export const bookingTypesRouter = createTRPCRouter({
	all: protectedProcedure.input(PaginationOptionsSchema).query(async ({ ctx, input }) => {
		const countQuery = await ctx.db
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(bookingTypes)
			.where(eq(bookingTypes.organizationId, ctx.user.organizationId));

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...input,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: BOOKING_TYPES_SORTABLE_COLUMNS,
		});

		const data = await ctx.db.query.bookingTypes.findMany({
			columns: {
				id: true,
				name: true,
				duration: true,
				color: true,
			},
			limit: limit,
			offset: (page - 1) * limit,
			where: eq(bookingTypes.organizationId, ctx.user.organizationId),
			orderBy: (bookingTypes, { asc }) => (orderBy ? [...orderBy, asc(bookingTypes.id)] : [asc(bookingTypes.id)]),
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
		const data = await ctx.db.query.bookingTypes.findMany({
			columns: {
				id: true,
				name: true,
				duration: true,
				color: true,
			},
			limit: 20,
			where: (bookingTypes, { and, eq, like }) =>
				and(
					eq(bookingTypes.organizationId, ctx.user.organizationId),
					like(bookingTypes.name, `%${input.searchTerm ?? ""}%`),
				),
			orderBy: (bookingTypes, { asc }) => [asc(bookingTypes.name), asc(bookingTypes.id)],
		});

		return { data: data };
	}),

	byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const data = await ctx.db.query.bookingTypes.findFirst({
			where: (bookingTypes, { and }) =>
				and(eq(bookingTypes.organizationId, ctx.user.organizationId), eq(bookingTypes.id, input.id)),
		});

		return { data: data ?? null };
	}),

	insert: protectedProcedure.input(InsertBookingTypeSchema).mutation(async ({ ctx, input }) => {
		await ctx.db.insert(bookingTypes).values({
			...input,
			organizationId: ctx.user.organizationId,
		});
	}),

	update: protectedProcedure.input(UpdateBookingTypeSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;
		await ctx.db
			.update(bookingTypes)
			.set(data)
			.where(and(eq(bookingTypes.organizationId, ctx.user.organizationId), eq(bookingTypes.id, id)));
	}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		await ctx.db.delete(bookingTypes).where(eq(bookingTypes.id, input.id));
	}),
});
