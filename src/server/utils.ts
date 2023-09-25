import { asc, desc, type AnyColumn } from "drizzle-orm";
import { z } from "zod";

export type SortableColumns = {
	[key: string]: {
		id: string;
		label: string;
		columns: AnyColumn[];
	};
};

export const PaginationOptionsSchema = z.object({
	page: z.coerce.number().int().min(1).optional().catch(1),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.catch((ctx) => {
			if (ctx.error?.issues?.[0]?.code === "too_small") {
				return 1;
			}
			if (ctx.error?.issues?.[0]?.code === "too_big") {
				return 100;
			}
			return 20;
		}),
	sortBy: z.string().optional().catch(undefined),
	sortDirection: z
		.union([z.literal("asc"), z.literal("desc")])
		.optional()
		.catch("asc"),
});
export type PaginationOptions = z.infer<typeof PaginationOptionsSchema>;

interface ValidatePaginationSearchParamsProps extends PaginationOptions {
	count?: number;
	sortableColumns: SortableColumns;
}

export function validatePaginationSearchParams({
	sortableColumns,
	count = 0,
	page = 1,
	limit = 20,
	sortBy,
	sortDirection = "asc",
}: ValidatePaginationSearchParamsProps) {
	const validPage = z.number().int().min(1).safeParse(page);
	const validLimit = z.number().int().min(1).max(100).safeParse(limit);

	if (!validPage.success || !page) {
		page = 1;
	}

	if (!validLimit.success || !limit) {
		limit = 20;
	}

	const maxPage = Math.ceil(count / limit) || 1;

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

export function constructFamilyName(
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
