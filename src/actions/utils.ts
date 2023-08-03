/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { asc, desc } from "drizzle-orm";
import { z } from "zod";

import { sessionCookieOptions, type SessionCookie } from "~/lib/auth-options";
import { jwt } from "~/lib/jwt";
import { type SortableColumns } from "./sortable-columns";

const SearchTermSchema = z.string();

type ServerActionResponse<Data, Error> =
	| {
			success: true;
			data: Data;
	  }
	| {
			success: false;
			error: Error;
			data: Data;
	  };

type ExtractServerActionData<T extends (...params: any) => Promise<ServerActionResponse<any, any>>> =
	ReturnType<T> extends Promise<ServerActionResponse<infer Data, any>> ? NonNullable<Data> : never;

function createServerAction<Fn extends (...params: any) => Promise<ServerActionResponse<any, z.ZodIssue[] | string>>>(
	fn: Fn,
) {
	return fn;
}

function separateActionsLogSchema<
	ActionSchema extends Record<
		string,
		{ type: "INSERT"; payload: any } | { type: "UPDATE"; payload: any } | { type: "DELETE"; payload: any }
	>,
>(actionSchema: ActionSchema, organizationId: string) {
	type Insert = Extract<ActionSchema[keyof ActionSchema], { type: "INSERT" }>["payload"] & { organizationId: string };
	type Update = Extract<ActionSchema[keyof ActionSchema], { type: "UPDATE" }>["payload"];
	type Delete = Extract<ActionSchema[keyof ActionSchema], { type: "DELETE" }>["payload"];

	const inserts: Array<Insert> = [];
	const updates: Array<Update> = [];
	const deletes: Array<Delete> = [];

	for (const action of Object.values(actionSchema)) {
		if (action.type === "INSERT") {
			inserts.push({ ...action.payload, organizationId } as Insert);
		}

		if (action.type === "UPDATE") {
			updates.push(action.payload as Update);
		}

		if (action.type === "DELETE") {
			deletes.push(action.payload as Delete);
		}
	}

	return { inserts, updates, deletes };
}

async function getServerSession() {
	const cookieStore = cookies();
	const sessionCookie = cookieStore.get(sessionCookieOptions.name);

	const sessionToken = sessionCookie?.value;

	if (!sessionToken) {
		throw new Error("No session token");
	}

	const sessionTokenData = (await jwt.verify(sessionToken)) as SessionCookie | null;

	if (!sessionTokenData) {
		throw new Error("Invalid session token");
	}

	return sessionTokenData;
}

async function getServerUser() {
	const sessionTokenData = await getServerSession();

	return sessionTokenData.user;
}

type PaginationSearchParams = {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortDirection?: string;
};

interface ValidatePaginationSearchParamsProps extends PaginationSearchParams {
	count?: number;
	sortableColumns: SortableColumns;
}

function validatePaginationSearchParams({
	sortableColumns,
	count = 0,
	page = 1,
	limit = 5,
	sortBy,
	sortDirection = "asc",
}: ValidatePaginationSearchParamsProps) {
	const validPage = z.number().int().min(1).safeParse(page);
	const validLimit = z.number().int().min(1).max(100).safeParse(limit);

	if (!validPage.success || !page) {
		page = 1;
	}

	if (!validLimit.success || !limit) {
		limit = 5;
	}

	const maxPage = Math.ceil(count / limit);

	if (page > maxPage) {
		page = maxPage;
	}

	if (sortDirection !== "desc") {
		sortDirection = "asc";
	}

	if (!sortBy || !(sortBy in sortableColumns)) {
		sortBy = Object.keys(sortableColumns)[0] ?? "id";
	}

	let orderBy = Object.values(sortableColumns)[0]?.columns.map((column) =>
		sortDirection === "desc" ? desc(column) : asc(column),
	);

	if (sortBy && sortBy in sortableColumns) {
		orderBy = sortableColumns[sortBy]!.columns.map((column) => (sortDirection === "desc" ? desc(column) : asc(column)));
	}

	return { count, page, limit, maxPage, sortBy, sortDirection, orderBy };
}

export {
	type ExtractServerActionData,
	createServerAction,
	SearchTermSchema,
	separateActionsLogSchema,
	getServerSession,
	getServerUser,
	type PaginationSearchParams,
	validatePaginationSearchParams,
};
