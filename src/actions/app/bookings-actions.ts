"use server";

import { revalidatePath } from "next/cache";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import { and, desc, eq, gt, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { bookings } from "~/db/schema";
import { InsertBookingSchema, UpdateBookingSchema } from "~/db/validation";
import { BOOKINGS_SORTABLE_COLUMNS } from "../sortable-columns";
import {
	createServerAction,
	getServerUser,
	validatePaginationSearchParams,
	type ExtractServerActionData,
	type PaginationSearchParams,
} from "../utils";

dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
	weekStart: 1,
});

const listBookings = createServerAction(async (options: PaginationSearchParams & { from?: string; to?: string }) => {
	try {
		const user = await getServerUser();

		let fromDate = options?.from ? dayjs(options.from) : undefined;

		if (!fromDate?.isValid()) {
			fromDate = undefined;
		}

		let toDate = options?.to ? dayjs(options.to) : undefined;

		if (!toDate?.isValid()) {
			toDate = undefined;
		}

		const countQuery = await drizzle
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(bookings)
			.where(
				and(
					eq(bookings.organizationId, user.organizationId),
					fromDate ? gte(bookings.date, fromDate.subtract(12, "hours").toDate()) : undefined,
					toDate ? lt(bookings.date, toDate.add(14, "hours").toDate()) : undefined,
				),
			);

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...options,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: BOOKINGS_SORTABLE_COLUMNS,
		});

		const data = await drizzle.query.bookings.findMany({
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
			},
			limit: limit,
			offset: (page - 1) * limit,
			where: and(
				eq(bookings.organizationId, user.organizationId),
				fromDate ? gte(bookings.date, fromDate.subtract(12, "hours").toDate()) : undefined,
				toDate ? lt(bookings.date, toDate.add(14, "hours").toDate()) : undefined,
			),
			orderBy: (bookings, { asc }) => (orderBy ? [...orderBy, asc(bookings.id)] : [asc(bookings.id)]),
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
			error: "Failed to list bookings",
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
type BookingsList = ExtractServerActionData<typeof listBookings>;

const SearchBookingsOptions = z.object({
	dogId: z.string(),
	cursor: z
		.object({
			id: z.string().cuid2(),
			date: z.date(),
		})
		.optional(),
	after: z.date().optional(),
	sortDirection: z.union([z.literal("asc"), z.literal("desc")]).optional(),
});
type SearchBookingsOptions = z.infer<typeof SearchBookingsOptions>;

const searchBookings = createServerAction(async (options: SearchBookingsOptions) => {
	const validation = SearchBookingsOptions.safeParse(options);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const { cursor, sortDirection, after, dogId } = validation.data;

		const data = await drizzle.query.bookings.findMany({
			limit: cursor ? 5 : 6,
			where: (bookings, { eq, or, and }) =>
				and(
					eq(bookings.organizationId, user.organizationId),
					eq(bookings.dogId, dogId),
					cursor
						? or(
								sortDirection === "asc" ? gt(bookings.date, cursor.date) : lt(bookings.date, cursor.date),
								and(eq(bookings.date, cursor.date), gt(bookings.id, cursor.id)),
						  )
						: undefined,
					after ? gte(bookings.date, after) : undefined,
				),
			orderBy: (bookings, { asc }) => [
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
			},
		});

		return {
			success: true,
			data,
		};
	} catch {
		return { success: false, error: "Failed to search bookings", data: null };
	}
});
type BookingsSearch = ExtractServerActionData<typeof searchBookings>;

const getBookingsByWeek = createServerAction(async (options?: { date?: string }) => {
	const validation = z.object({ date: z.string().optional() }).optional().safeParse(options);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const date = dayjs(validation?.data?.date);

		if (!date.isValid) {
			return { success: false, error: "Invalid date", data: null };
		}

		const data = await drizzle.query.bookings.findMany({
			where: and(
				eq(bookings.organizationId, user.organizationId),
				// -12 hours to +14 hours to account for timezone differences
				gte(bookings.date, date.startOf("week").subtract(12, "hours").toDate()),
				lt(bookings.date, date.endOf("week").add(14, "hours").toDate()),
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

		return { success: true, data };
	} catch {
		return { success: false, error: "Failed to get bookings by week", data: null };
	}
});
type BookingsByWeek = ExtractServerActionData<typeof getBookingsByWeek>;

const getBookingById = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.bookings.findFirst({
			where: and(eq(bookings.organizationId, user.organizationId), eq(bookings.id, validId.data)),
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

		return { success: true, data };
	} catch {
		return { success: false, error: `Failed to get booking with id ${validId.data}`, data: null };
	}
});
type BookingById = ExtractServerActionData<typeof getBookingById>;

const insertBooking = createServerAction(async (values: InsertBookingSchema) => {
	const validation = InsertBookingSchema.safeParse(values);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = validation.data;

		await drizzle.transaction(async (trx) => {
			await trx.insert(bookings).values({
				...data,
				organizationId: user.organizationId,
			});
		});

		const booking = await drizzle.query.bookings.findFirst({
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
			},
			where: and(eq(bookings.organizationId, user.organizationId), eq(bookings.id, data.id)),
		});

		revalidatePath("/bookings");
		revalidatePath("/booking/[id]");
		revalidatePath("/calendar/week/[...date]");

		return { success: true, data: booking };
	} catch {
		return { success: false, error: `Failed to insert booking with id: ${validation.data.id}`, data: null };
	}
});
type BookingInsert = ExtractServerActionData<typeof insertBooking>;

const updateBooking = createServerAction(async (values: UpdateBookingSchema) => {
	const validation = UpdateBookingSchema.safeParse(values);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const { id, ...data } = validation.data;

		await drizzle
			.update(bookings)
			.set(data)
			.where(and(eq(bookings.organizationId, user.organizationId), eq(bookings.id, id)));

		const booking = await drizzle.query.bookings.findFirst({
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
			},
			where: and(eq(bookings.organizationId, user.organizationId), eq(bookings.id, id)),
		});

		revalidatePath("/bookings");
		revalidatePath("/booking/[id]");
		revalidatePath("/calendar/week/[...date]");

		return { success: true, data: booking };
	} catch {
		return { success: false, error: `Failed to update booking with id: ${validation.data.id}`, data: null };
	}
});
type BookingUpdate = ExtractServerActionData<typeof updateBooking>;

const deleteBooking = createServerAction(async (booking: { id: string; dogId: string }) => {
	const validation = z.object({ id: z.string(), dogId: z.string() }).safeParse(booking);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		await drizzle
			.delete(bookings)
			.where(and(eq(bookings.organizationId, user.organizationId), eq(bookings.id, booking.id)));

		const countQuery = await drizzle
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(bookings)
			.where(and(eq(bookings.organizationId, user.organizationId), eq(bookings.dogId, booking.dogId)));

		return {
			success: true,
			data: {
				count: countQuery[0]?.count ?? 0,
			},
		};
	} catch {
		return { success: false, error: `Failed to delete booking with id: ${booking.id}`, data: null };
	}
});
type BookingDelete = ExtractServerActionData<typeof deleteBooking>;

export {
	listBookings,
	type BookingsList,
	searchBookings,
	type BookingsSearch,
	getBookingsByWeek,
	type BookingsByWeek,
	getBookingById,
	type BookingById,
	insertBooking,
	type BookingInsert,
	updateBooking,
	type BookingUpdate,
	deleteBooking,
	type BookingDelete,
};
