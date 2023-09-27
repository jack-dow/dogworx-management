import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { type drizzle } from "~/db/drizzle";
import {
	bookings as bookingsTable,
	clients,
	dogs,
	dogToClientRelationships as dogToClientRelationshipsTable,
	dogToVetRelationships as dogToVetRelationshipsTable,
} from "~/db/schema/app";
import {
	IdSchema,
	InsertDogSchema,
	InsertDogToClientRelationshipSchema,
	InsertDogToVetRelationshipSchema,
	UpdateDogSchema,
	UpdateDogToClientRelationshipSchema,
	UpdateDogToVetRelationshipSchema,
} from "~/db/validation/app";
import { PaginationOptionsSchema, validatePaginationSearchParams } from "~/server/utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { DOGS_SORTABLE_COLUMNS } from "../sortable-columns";

function constructFamilyName(
	dogToClientRelationships: Array<{ relationship: string; client: { familyName: string | undefined } | null }>,
	updatedFamilyName?: string,
) {
	return [
		...new Set(
			dogToClientRelationships
				.filter(({ relationship, client }) => relationship === "owner" && client != null && !!client.familyName)
				.map(({ client }) => client!.familyName)
				.concat(updatedFamilyName ?? []),
		),
	]
		.sort()
		.join("/");
}

export async function updateDogsFamilyName({ id, db }: { id: string; db: typeof drizzle }) {
	const dogFamilyName = await db
		.select({
			familyName: sql<string>`GROUP_CONCAT(${clients.familyName} SEPARATOR '/')`,
		})
		.from(dogToClientRelationshipsTable)
		.innerJoin(clients, eq(clients.id, dogToClientRelationshipsTable.clientId))
		.where(and(eq(dogToClientRelationshipsTable.dogId, id), eq(dogToClientRelationshipsTable.relationship, "owner")));

	await db
		.update(dogs)
		.set({ familyName: dogFamilyName?.[0]?.familyName })
		.where(eq(dogs.id, id));
}

export const dogsRouter = createTRPCRouter({
	all: protectedProcedure.input(PaginationOptionsSchema).query(async ({ ctx, input }) => {
		const countQuery = await ctx.db
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(dogs)
			.where(eq(dogs.organizationId, ctx.user.organizationId));

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...input,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: DOGS_SORTABLE_COLUMNS,
		});

		const data = await ctx.db.query.dogs.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				breed: true,
				color: true,
			},
			limit: limit,
			offset: (page - 1) * limit,
			where: eq(dogs.organizationId, ctx.user.organizationId),
			orderBy: (dogs, { asc }) => (orderBy ? [...orderBy, asc(dogs.id)] : [asc(dogs.id)]),
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
		const names = input.searchTerm.split(" ");
		let givenName = names[0];
		if (names.length > 0) {
			givenName = names.shift();
		}
		const familyName = names.join(" ");

		const data = await ctx.db.query.dogs.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				breed: true,
				color: true,
			},
			limit: 20,
			where: (dogs, { and, eq, or, like }) =>
				and(
					eq(dogs.organizationId, ctx.user.organizationId),
					or(like(dogs.givenName, `%${givenName}%`), like(dogs.familyName, `%${familyName || givenName}%`)),
				),
			orderBy: (dogs, { asc }) => [asc(dogs.givenName), asc(dogs.id)],
		});

		return { data };
	}),

	byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const data = await ctx.db.query.dogs.findFirst({
			where: (dogs, { and, eq }) => and(eq(dogs.organizationId, ctx.user.organizationId), eq(dogs.id, input.id)),
			with: {
				bookings: {
					// We show 5 bookings at a time on the dog page, so we must fetch 6 bookings to see if there is a next page.
					limit: 6,
					where: (bookings, { lte }) => lte(bookings.date, new Date()),
					orderBy: (bookings, { asc, desc }) => [desc(bookings.date), asc(bookings.id)],
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
						assignedTo: {
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

		return { data };
	}),

	insert: protectedProcedure.input(InsertDogSchema).mutation(async ({ ctx, input }) => {
		const { bookings, dogToClientRelationships, dogToVetRelationships, ...data } = input;

		const bookingsArray = bookings?.map((booking) => ({
			...booking,
			organizationId: ctx.user.organizationId,
		}));

		const dogToClientRelationshipsArray = dogToClientRelationships?.map((relationship) => ({
			...relationship,
			organizationId: ctx.user.organizationId,
		}));

		const dogToVetRelationshipsArray = dogToVetRelationships?.map((relationship) => ({
			...relationship,
			organizationId: ctx.user.organizationId,
		}));

		await ctx.db.transaction(async (trx) => {
			await trx.insert(dogs).values({
				...data,
				familyName: constructFamilyName(dogToClientRelationshipsArray),
				organizationId: ctx.user.organizationId,
			});

			if (bookings.length > 0) {
				await trx.insert(bookingsTable).values(bookingsArray);
			}

			if (dogToClientRelationshipsArray.length > 0) {
				await trx.insert(dogToClientRelationshipsTable).values(dogToClientRelationshipsArray);
			}

			if (dogToVetRelationshipsArray.length > 0) {
				await trx.insert(dogToVetRelationshipsTable).values(dogToVetRelationshipsArray);
			}
		});
	}),

	update: protectedProcedure.input(UpdateDogSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;

		await ctx.db
			.update(dogs)
			.set(data)
			.where(and(eq(dogs.organizationId, ctx.user.organizationId), eq(dogs.id, id)));
	}),

	dogToClientRelationships: createTRPCRouter({
		insert: protectedProcedure.input(InsertDogToClientRelationshipSchema).mutation(async ({ ctx, input }) => {
			await ctx.db.transaction(async (trx) => {
				await trx.insert(dogToClientRelationshipsTable).values({
					...input,
					organizationId: ctx.user.organizationId,
				});

				await updateDogsFamilyName({ id: input.dogId, db: trx });
			});
		}),

		update: protectedProcedure
			.input(UpdateDogToClientRelationshipSchema.extend({ dogId: IdSchema }))
			.mutation(async ({ ctx, input }) => {
				const { id, ...data } = input;

				await ctx.db.transaction(async (trx) => {
					await trx
						.update(dogToClientRelationshipsTable)
						.set(data)
						.where(
							and(
								eq(dogToClientRelationshipsTable.organizationId, ctx.user.organizationId),
								eq(dogToClientRelationshipsTable.id, id),
							),
						);

					await updateDogsFamilyName({ id: data.dogId, db: trx });
				});
			}),

		delete: protectedProcedure.input(z.object({ id: IdSchema, dogId: IdSchema })).mutation(async ({ ctx, input }) => {
			await ctx.db.transaction(async (trx) => {
				await trx
					.delete(dogToClientRelationshipsTable)
					.where(
						and(
							eq(dogToClientRelationshipsTable.organizationId, ctx.user.organizationId),
							eq(dogToClientRelationshipsTable.id, input.id),
						),
					);

				await updateDogsFamilyName({ id: input.dogId, db: trx });
			});
		}),
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

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		await ctx.db.transaction(async (trx) => {
			await trx.delete(dogs).where(and(eq(dogs.organizationId, ctx.user.organizationId), eq(dogs.id, input.id)));

			await trx
				.delete(bookingsTable)
				.where(and(eq(bookingsTable.organizationId, ctx.user.organizationId), eq(bookingsTable.dogId, input.id)));

			await trx
				.delete(dogToClientRelationshipsTable)
				.where(
					and(
						eq(dogToClientRelationshipsTable.organizationId, ctx.user.organizationId),
						eq(dogToClientRelationshipsTable.dogId, input.id),
					),
				);

			await trx
				.delete(dogToVetRelationshipsTable)
				.where(
					and(
						eq(dogToVetRelationshipsTable.organizationId, ctx.user.organizationId),
						eq(dogToVetRelationshipsTable.dogId, input.id),
					),
				);
		});
	}),
});
