"use server";

import { revalidatePath } from "next/cache";
import { and, eq, like, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { bookingTypes } from "~/db/schema";
import { InsertBookingTypeSchema, UpdateBookingTypeSchema } from "~/db/validation";
import { BOOKING_TYPES_SORTABLE_COLUMNS } from "../sortable-columns";
import {
	createServerAction,
	getServerUser,
	SearchTermSchema,
	validatePaginationSearchParams,
	type ExtractServerActionData,
	type PaginationSearchParams,
} from "../utils";

const listBookingTypes = createServerAction(async (options: PaginationSearchParams) => {
	try {
		const user = await getServerUser();

		const countQuery = await drizzle
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(bookingTypes)
			.where(eq(bookingTypes.organizationId, user.organizationId));

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...options,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: BOOKING_TYPES_SORTABLE_COLUMNS,
		});

		const data = await drizzle.query.bookingTypes.findMany({
			columns: {
				id: true,
				name: true,
				duration: true,
				color: true,
			},
			limit: limit,
			offset: (page - 1) * limit,
			where: eq(bookingTypes.organizationId, user.organizationId),
			orderBy: (bookingTypes, { asc }) => (orderBy ? [...orderBy, asc(bookingTypes.id)] : [asc(bookingTypes.id)]),
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
			error: "Failed to list booking types",
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
type BookingTypesList = ExtractServerActionData<typeof listBookingTypes>;

const searchBookingTypes = createServerAction(async (searchTerm: string) => {
	const validSearchTerm = SearchTermSchema.safeParse(searchTerm);

	if (!validSearchTerm.success) {
		return { success: false, error: validSearchTerm.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.bookingTypes.findMany({
			columns: {
				id: true,
				name: true,
				duration: true,
				color: true,
			},
			limit: 20,
			where: and(
				eq(bookingTypes.organizationId, user.organizationId),
				like(bookingTypes.name, `%${validSearchTerm.data ?? ""}%`),
			),
			orderBy: (bookingTypes, { asc }) => [asc(bookingTypes.name), asc(bookingTypes.id)],
		});

		return { success: true, data };
	} catch {
		return { success: false, error: "Failed to search booking types", data: null };
	}
});
type BookingTypesSearch = ExtractServerActionData<typeof searchBookingTypes>;

const getBookingTypeById = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.bookingTypes.findFirst({
			where: and(eq(bookingTypes.organizationId, user.organizationId), eq(bookingTypes.id, validId.data)),
		});

		return { success: true, data };
	} catch {
		return { success: false, error: `Failed to get booking type with id ${validId.data}`, data: null };
	}
});
type BookingTypeById = ExtractServerActionData<typeof getBookingTypeById>;

const insertBookingType = createServerAction(async (values: InsertBookingTypeSchema) => {
	const validValues = InsertBookingTypeSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = validValues.data;

		await drizzle.insert(bookingTypes).values({
			...data,
			organizationId: user.organizationId,
		});

		revalidatePath("/settings/booking-types");

		const bookingType = await drizzle.query.bookingTypes.findFirst({
			where: and(eq(bookingTypes.organizationId, user.organizationId), eq(bookingTypes.id, data.id)),
			columns: {
				id: true,
				name: true,
				duration: true,
				color: true,
			},
		});

		return { success: true, data: bookingType };
	} catch {
		return { success: false, error: "Failed to insert booking type", data: null };
	}
});
type BookingTypeInsert = ExtractServerActionData<typeof insertBookingType>;

const updateBookingType = createServerAction(async (values: UpdateBookingTypeSchema) => {
	const validValues = UpdateBookingTypeSchema.safeParse(values);

	if (!validValues.success) {
		return { success: false, error: validValues.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const { id, ...data } = validValues.data;

		await drizzle
			.update(bookingTypes)
			.set(data)
			.where(and(eq(bookingTypes.organizationId, user.organizationId), eq(bookingTypes.id, id)));

		revalidatePath("/bookingTypes");

		const bookingType = await drizzle.query.bookingTypes.findFirst({
			columns: {
				id: true,
				name: true,
				duration: true,
				color: true,
			},
			where: and(eq(bookingTypes.organizationId, user.organizationId), eq(bookingTypes.id, id)),
		});

		return { success: true, data: bookingType };
	} catch {
		return { success: false, error: "Failed to update booking type", data: null };
	}
});
type BookingTypeUpdate = ExtractServerActionData<typeof updateBookingType>;

const deleteBookingType = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const bookingType = await drizzle.query.bookingTypes.findFirst({
			where: and(eq(bookingTypes.organizationId, user.organizationId), eq(bookingTypes.id, validId.data)),
			columns: {
				id: true,
			},
		});

		if (bookingType) {
			await drizzle.delete(bookingTypes).where(eq(bookingTypes.id, id));
		}

		revalidatePath("/bookingTypes");

		return { success: true, data: validId.data };
	} catch {
		return { success: false, error: "Failed to delete booking type", data: null };
	}
});
type BookingTypeDelete = ExtractServerActionData<typeof deleteBookingType>;

export {
	listBookingTypes,
	type BookingTypesList,
	searchBookingTypes,
	type BookingTypesSearch,
	getBookingTypeById,
	type BookingTypeById,
	insertBookingType,
	type BookingTypeInsert,
	updateBookingType,
	type BookingTypeUpdate,
	deleteBookingType,
	type BookingTypeDelete,
};
