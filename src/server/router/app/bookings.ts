import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";

import { bookings } from "~/db/schema/app";
import { InsertBookingSchema, UpdateBookingSchema } from "~/db/validation/app";
import { getBaseUrl, PaginationOptionsSchema, validatePaginationSearchParams } from "~/lib/utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { BOOKINGS_SORTABLE_COLUMNS } from "../sortable-columns";

dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
	weekStart: 1,
});

export const bookingsRouter = createTRPCRouter({
	all: protectedProcedure
		.input(
			PaginationOptionsSchema.extend({
				from: z.string().optional().catch(undefined),
				to: z.string().optional().catch(undefined),
			}),
		)
		.query(async ({ ctx, input }) => {
			let fromDate = input?.from ? dayjs(input.from) : undefined;

			if (!fromDate?.isValid()) {
				fromDate = undefined;
			}

			let toDate = input?.to ? dayjs(input.to) : undefined;

			if (!toDate?.isValid()) {
				toDate = undefined;
			}

			const countQuery = await ctx.db
				.select({
					count: sql<number>`count(*)`.mapWith(Number),
				})
				.from(bookings)
				.where(
					and(
						eq(bookings.organizationId, ctx.user.organizationId),
						fromDate ? gte(bookings.date, fromDate.subtract(12, "hours").toDate()) : undefined,
						toDate ? lt(bookings.date, toDate.add(14, "hours").toDate()) : undefined,
					),
				);

			const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
				...input,
				count: countQuery?.[0]?.count ?? 0,
				sortableColumns: BOOKINGS_SORTABLE_COLUMNS,
			});

			const data = await ctx.db.query.bookings.findMany({
				columns: {
					id: true,
					assignedToId: true,
					dogId: true,
					date: true,
					duration: true,
				},
				with: {
					dog: {
						columns: {
							givenName: true,
							familyName: true,
						},
					},
					bookingType: {
						columns: {
							color: true,
							name: true,
						},
					},
				},
				limit: limit,
				offset: (page - 1) * limit,
				where: and(
					eq(bookings.organizationId, ctx.user.organizationId),
					fromDate ? gte(bookings.date, fromDate.subtract(12, "hours").toDate()) : undefined,
					toDate ? lt(bookings.date, toDate.add(14, "hours").toDate()) : undefined,
				),
				orderBy: (bookings, { asc }) => (orderBy ? [...orderBy, asc(bookings.id)] : [asc(bookings.id)]),
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

	checkForOverlaps: protectedProcedure
		.input(
			z.object({
				assignedToId: z.string(),
				date: z.date(),
				duration: z.number(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { assignedToId, date, duration } = input;

			const endDate = dayjs(date).add(duration, "seconds").toDate();

			const data = await ctx.db.query.bookings.findMany({
				columns: {
					id: true,
				},
				extras: {
					endDate: sql<Date>`date_add(${bookings.date}, INTERVAL ${bookings.duration} SECOND)`.as("end_date"),
				},
				where: (bookings, { and, eq, or, lte, gt, gte }) =>
					and(
						eq(bookings.organizationId, ctx.user.organizationId),
						eq(bookings.assignedToId, assignedToId),
						or(
							// Check if new booking starts during an existing booking
							and(
								lte(bookings.date, date),
								gt(sql<Date>`date_add(${bookings.date}, INTERVAL ${bookings.duration} SECOND)`, date),
							),
							// Check if new booking ends during an existing booking
							and(
								lt(bookings.date, endDate),
								gte(sql<Date>`date_add(${bookings.date}, INTERVAL ${bookings.duration} SECOND)`, endDate),
							),
							// Check if new booking completely overlaps with an existing booking
							and(
								gte(bookings.date, date),
								lte(sql<Date>`date_add(${bookings.date}, INTERVAL ${bookings.duration} SECOND)`, endDate),
							),
						),
					),
			});

			return {
				data,
			};
		}),

	search: protectedProcedure
		.input(
			z.object({
				dogId: z.string(),
				cursor: z
					.object({
						id: z.string().cuid2(),
						date: z.date(),
					})
					.optional(),
				after: z.date().optional(),
				sortDirection: z.union([z.literal("asc"), z.literal("desc")]).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { cursor, sortDirection, after, dogId } = input;

			const data = await ctx.db.query.bookings.findMany({
				// We display 5 bookings at a time, so if there is no cursor, we want to fetch 6 bookings to see if there is a next page.
				limit: cursor ? 5 : 6,
				where: (bookings, { eq, or, and, gt }) =>
					and(
						eq(bookings.organizationId, ctx.user.organizationId),
						eq(bookings.dogId, dogId),
						cursor
							? or(
									sortDirection === "asc" ? gt(bookings.date, cursor.date) : lt(bookings.date, cursor.date),
									and(eq(bookings.date, cursor.date), gt(bookings.id, cursor.id)),
							  )
							: undefined,
						after ? gte(bookings.date, after) : undefined,
					),
				orderBy: (bookings, { asc, desc }) => [
					sortDirection === "asc" ? asc(bookings.date) : desc(bookings.date),
					asc(bookings.id),
				],
				with: {
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
			});

			return {
				data,
			};
		}),

	byWeek: protectedProcedure
		.input(z.object({ date: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const date = dayjs(input?.date).startOf("day");
			const day = date.day();

			if (!date.isValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid date",
				});
			}

			const data = await ctx.db.query.bookings.findMany({
				where: and(
					eq(bookings.organizationId, ctx.user.organizationId),
					// -12 hours to +14 hours to account for timezone differences
					// Not using .startOf week as it can become the wrong week.
					// E.g. If a user from Brisbane (UTC+10) views the calendar at 8am on Monday, it will show the previous week as it would be 10pm Sunday UTC.
					gte(
						bookings.date,
						date
							.subtract(day === 0 ? 7 : day - 1, "day")
							.subtract(14, "hours")
							.toDate(),
					),
					lt(
						bookings.date,
						date
							.endOf("day")
							.add(day === 0 ? 0 : 7 - day, "day")
							.add(12, "hours")
							.toDate(),
					),
				),
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
			});

			return { data };
		}),

	byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const data = await ctx.db.query.bookings.findFirst({
			where: and(eq(bookings.organizationId, ctx.user.organizationId), eq(bookings.id, input.id)),
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
		});

		return { data };
	}),

	insert: protectedProcedure.input(InsertBookingSchema).mutation(async ({ ctx, input }) => {
		await ctx.db.insert(bookings).values({
			...input,
			organizationId: ctx.user.organizationId,
		});

		if (input.date > new Date()) {
			void fetch(getBaseUrl() + "/api/emails/booking-confirmation", {
				method: "POST",
				credentials: "include",
				headers: {
					cookie: ctx.request.headers.get("cookie") ?? "",
				},
				body: JSON.stringify({ bookingId: input.id }),
			});
		}
	}),

	update: protectedProcedure.input(UpdateBookingSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;

		await ctx.db
			.update(bookings)
			.set(data)
			.where(and(eq(bookings.organizationId, ctx.user.organizationId), eq(bookings.id, id)));
	}),

	delete: protectedProcedure
		.input(z.object({ id: z.string(), dogId: z.string().optional() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(bookings)
				.where(and(eq(bookings.organizationId, ctx.user.organizationId), eq(bookings.id, input.id)));

			const countQuery = await ctx.db
				.select({
					count: sql<number>`count(*)`.mapWith(Number),
				})
				.from(bookings)
				.where(
					and(
						eq(bookings.organizationId, ctx.user.organizationId),
						input.dogId ? eq(bookings.dogId, input.dogId) : undefined,
					),
				);

			return {
				count: countQuery[0]?.count ?? 0,
			};
		}),
});
