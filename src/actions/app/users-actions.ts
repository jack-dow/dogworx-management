"use server";

import { eq, like, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { users } from "~/db/schema";
import { USERS_SORTABLE_COLUMNS } from "../sortable-columns";
import {
	createServerAction,
	getServerUser,
	SearchTermSchema,
	validatePaginationSearchParams,
	type ExtractServerActionData,
	type PaginationSearchParams,
} from "../utils";

const listUsers = createServerAction(async (options: PaginationSearchParams) => {
	try {
		const user = await getServerUser();

		const countQuery = await drizzle
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(users)
			.where(eq(users.organizationId, user.organizationId));

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...options,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: USERS_SORTABLE_COLUMNS,
		});

		const data = await drizzle.query.users.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
			},
			limit: limit ?? 50,
			orderBy: (users, { asc }) => (orderBy ? [...orderBy, asc(users.id)] : [asc(users.id)]),
			where: eq(users.organizationId, user.organizationId),
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
			error: "Failed to list users",
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
type UsersList = ExtractServerActionData<typeof listUsers>;

const searchUsers = createServerAction(async (searchTerm: string) => {
	const validation = SearchTermSchema.safeParse(searchTerm);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.users.findMany({
			columns: {
				id: true,
				givenName: true,
				familyName: true,
				emailAddress: true,
			},
			limit: 20,
			where: (users, { and, eq, or }) =>
				and(
					eq(users.organizationId, user.organizationId),
					or(
						sql`CONCAT(${users.givenName},' ', ${users.familyName}) LIKE CONCAT('%', ${validation.data}, '%')`,
						like(users.emailAddress, `%${validation.data}%`),
					),
				),
			orderBy: (users, { asc }) => [asc(users.givenName), asc(users.familyName), asc(users.id)],
		});

		return { success: true, data };
	} catch {
		return { success: false, error: "Failed to search users", data: null };
	}
});
type UsersSearch = ExtractServerActionData<typeof searchUsers>;

const getUserById = createServerAction(async (id: string) => {
	const validation = z.string().safeParse(id);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.users.findFirst({
			where: (users, { and, eq }) => and(eq(users.id, validation.data), eq(users.organizationId, user.organizationId)),
		});

		return { success: true, data };
	} catch {
		return { success: false, error: `Failed to get user with id ${validation.data}`, data: null };
	}
});
type UserById = ExtractServerActionData<typeof getUserById>;

export { listUsers, type UsersList, searchUsers, type UsersSearch, getUserById, type UserById };
