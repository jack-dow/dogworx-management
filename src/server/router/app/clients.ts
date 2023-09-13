import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { clients, dogs, dogToClientRelationships as dogToClientRelationshipsTable } from "~/db/schema/app";
import {
	InsertClientSchema,
	InsertDogToClientRelationshipSchema,
	UpdateClientSchema,
	UpdateDogToClientRelationshipSchema,
} from "~/db/validation/app";
import { constructFamilyName, PaginationOptionsSchema, validatePaginationSearchParams } from "~/server/utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { CLIENTS_SORTABLE_COLUMNS } from "../sortable-columns";

export const clientsRouter = createTRPCRouter({
	all: protectedProcedure.input(PaginationOptionsSchema).query(async ({ ctx, input }) => {
		const countQuery = await ctx.db
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(clients)
			.where(eq(clients.organizationId, ctx.user.organizationId));

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...input,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: CLIENTS_SORTABLE_COLUMNS,
		});

		const data = await ctx.db.query.clients.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: limit,
			offset: (page - 1) * limit,
			where: eq(clients.organizationId, ctx.user.organizationId),
			orderBy: (clients, { asc }) => (orderBy ? [...orderBy, asc(clients.id)] : [asc(clients.id)]),
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
		const data = await ctx.db.query.clients.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			limit: 20,
			where: (clients, { and, eq, or, sql, like }) =>
				and(
					eq(clients.organizationId, ctx.user.organizationId),
					or(
						sql`CONCAT(${clients.givenName},' ', ${clients.familyName}) LIKE CONCAT('%', ${input.searchTerm}, '%')`,
						like(clients.emailAddress, `%${input.searchTerm}%`),
						like(clients.phoneNumber, `%${input.searchTerm}%`),
					),
				),
			orderBy: (clients, { asc }) => [asc(clients.givenName), asc(clients.familyName), asc(clients.id)],
		});

		return { data };
	}),

	byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const data = await ctx.db.query.clients.findFirst({
			where: (clients, { and, eq }) =>
				and(eq(clients.organizationId, ctx.user.organizationId), eq(clients.id, input.id)),
			with: {
				dogToClientRelationships: {
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
			},
		});

		return { data };
	}),

	insert: protectedProcedure.input(InsertClientSchema).mutation(async ({ ctx, input }) => {
		const { dogToClientRelationships, ...data } = input;

		await ctx.db.transaction(async (trx) => {
			await trx.insert(clients).values({
				...data,
				organizationId: ctx.user.organizationId,
			});

			if (dogToClientRelationships && dogToClientRelationships.length > 0) {
				const dogToClientRelationshipsArray = dogToClientRelationships.map((relationship) => ({
					...relationship,
					organizationId: ctx.user.organizationId,
				}));

				await trx.insert(dogToClientRelationshipsTable).values(dogToClientRelationshipsArray);

				if (data.familyName) {
					const clientsDogs = await ctx.db.query.dogs.findMany({
						columns: {
							id: true,
							familyName: true,
						},
						where: (dogs, { and, eq, inArray }) =>
							and(
								eq(dogs.organizationId, ctx.user.organizationId),
								inArray(
									dogs.id,
									dogToClientRelationshipsArray
										.filter(({ relationship }) => relationship === "owner")
										.map((dogToClientRelationship) => dogToClientRelationship.dogId),
								),
							),
					});

					for (const dog of clientsDogs) {
						if (dog.familyName && dog.familyName.includes(data.familyName)) {
							continue;
						}

						await trx
							.update(dogs)
							.set({
								familyName: dog.familyName
									? [...new Set([data.familyName, ...dog.familyName.split("/")])].sort().join("/")
									: data.familyName,
							})
							.where(eq(dogs.id, dog.id));
					}
				}
			}
		});

		const client = await ctx.db.query.clients.findFirst({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			where: (clients, { and, eq }) =>
				and(eq(clients.organizationId, ctx.user.organizationId), eq(clients.id, data.id)),
		});

		return { data: client };
	}),

	update: protectedProcedure.input(UpdateClientSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;

		await ctx.db
			.update(clients)
			.set(data)
			.where(and(eq(clients.organizationId, ctx.user.organizationId), eq(clients.id, id)));

		if (input.familyName) {
			const clientsDogToClientRelationships = await ctx.db.query.dogToClientRelationships.findMany({
				columns: {
					id: true,
					relationship: true,
				},
				where: (dogToClientRelationships, { and, eq }) =>
					and(
						eq(dogToClientRelationships.organizationId, ctx.user.organizationId),
						eq(dogToClientRelationships.clientId, id),
						eq(dogToClientRelationships.relationship, "owner"),
					),
				with: {
					dog: {
						columns: {
							id: true,
						},
						with: {
							dogToClientRelationships: {
								where: (dogToClientRelationships, { and, eq, ne }) =>
									and(eq(dogToClientRelationships.relationship, "owner"), ne(dogToClientRelationships.clientId, id)),
								columns: {
									id: true,
									relationship: true,
								},
								with: {
									client: {
										columns: {
											familyName: true,
										},
									},
								},
							},
						},
					},
				},
			});

			for (const dogToClientRelationship of clientsDogToClientRelationships) {
				if (!dogToClientRelationship.dog) {
					await ctx.db.delete(dogToClientRelationshipsTable).where(eq(dogs.id, dogToClientRelationship.id));
					continue;
				}

				await ctx.db
					.update(dogs)
					.set({
						familyName: constructFamilyName(dogToClientRelationship.dog.dogToClientRelationships, data.familyName),
					})
					.where(eq(dogs.id, dogToClientRelationship.dog.id));
			}
		}

		const client = await ctx.db.query.clients.findFirst({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
				phoneNumber: true,
			},
			where: and(eq(clients.organizationId, ctx.user.organizationId), eq(clients.id, id)),
		});

		return { data: client };
	}),

	dogToClientRelationships: createTRPCRouter({
		insert: protectedProcedure.input(InsertDogToClientRelationshipSchema).mutation(async ({ ctx, input }) => {
			await ctx.db.insert(dogToClientRelationshipsTable).values({
				...input,
				organizationId: ctx.user.organizationId,
			});
		}),

		update: protectedProcedure.input(UpdateDogToClientRelationshipSchema).mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			await ctx.db
				.update(dogToClientRelationshipsTable)
				.set(data)
				.where(
					and(
						eq(dogToClientRelationshipsTable.organizationId, ctx.user.organizationId),
						eq(dogToClientRelationshipsTable.id, id),
					),
				);
		}),

		delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(dogToClientRelationshipsTable)
				.where(
					and(
						eq(dogToClientRelationshipsTable.organizationId, ctx.user.organizationId),
						eq(dogToClientRelationshipsTable.id, input.id),
					),
				);
		}),
	}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		const clientsDogToClientRelationships = await ctx.db.query.dogToClientRelationships.findMany({
			columns: {
				id: true,
				relationship: true,
			},
			where: (dogToClientRelationships, { and, eq }) =>
				and(
					eq(dogToClientRelationships.organizationId, ctx.user.organizationId),
					eq(dogToClientRelationships.clientId, input.id),
					eq(dogToClientRelationships.relationship, "owner"),
				),
			with: {
				dog: {
					columns: {
						id: true,
					},
					with: {
						dogToClientRelationships: {
							where: (dogToClientRelationships, { and, eq, ne }) =>
								and(
									eq(dogToClientRelationships.relationship, "owner"),
									ne(dogToClientRelationships.clientId, input.id),
								),
							columns: {
								id: true,
								relationship: true,
							},
							with: {
								client: {
									columns: {
										familyName: true,
									},
								},
							},
						},
					},
				},
			},
		});

		await ctx.db.transaction(async (trx) => {
			await trx.delete(clients).where(eq(clients.id, input.id));

			if (clientsDogToClientRelationships.length > 0) {
				for (const dogToClientRelationship of clientsDogToClientRelationships) {
					if (!dogToClientRelationship.dog) {
						await ctx.db.delete(dogToClientRelationshipsTable).where(eq(dogs.id, dogToClientRelationship.id));
						continue;
					}

					await ctx.db
						.update(dogs)
						.set({
							familyName: constructFamilyName(dogToClientRelationship.dog.dogToClientRelationships),
						})
						.where(eq(dogs.id, dogToClientRelationship.dog.id));
				}

				await trx
					.delete(dogToClientRelationshipsTable)
					.where(
						and(
							eq(dogToClientRelationshipsTable.organizationId, ctx.user.organizationId),
							eq(dogToClientRelationshipsTable.clientId, input.id),
						),
					);
			}
		});
	}),
});
