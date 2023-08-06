import { type ReadonlyURLSearchParams } from "next/navigation";
import { createId } from "@paralleldrive/cuid2";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type z } from "zod";

import { type PaginationSearchParams } from "./actions/utils";

type DefaultErrorCodes = "InvalidBody" | "UnknownError" | "NotAuthorized";

type APIResponse<Data, ErrorCodes extends string | undefined = undefined> =
	| (Data extends undefined ? { success: true; error?: never } : { success: true; data: Data; error?: never })
	| {
			success: false;
			error: {
				code: ErrorCodes extends undefined ? DefaultErrorCodes : DefaultErrorCodes | ErrorCodes;
				message: string | z.ZodIssue[];
			};
			data?: never;
	  };

const generateId = createId;

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Function to handle the mergining of current and new relationships as react-hook-form wasn't doing it properly */
function mergeRelationships<Relationship extends { id: string; relationship: string }>(
	current: Relationship[] = [],
	updates: Relationship[] = [],
	actions: Record<
		string,
		| {
				type: "INSERT";
				payload: Record<string, unknown>;
		  }
		| {
				type: "UPDATE";
				payload: Record<string, unknown>;
		  }
		| {
				type: "DELETE";
				payload: string;
		  }
	> = {},
) {
	const currentAsObject = current.reduce(
		(acc, curr) => {
			acc[curr.id] = curr;
			return acc;
		},
		{} as Record<string, Relationship>,
	);

	const newRelationships = { ...currentAsObject };

	for (const update of updates) {
		const action = actions[update.id];

		if (action) {
			if (action.type === "UPDATE") {
				newRelationships[update.id] = {
					...update,
					relationship: action.payload.relationship ?? update.relationship,
				};
			}
		} else {
			newRelationships[update.id] = update;
		}
	}

	return Object.values(newRelationships);
}

function getBaseUrl() {
	if (typeof window !== "undefined") return ""; // browser should use relative url
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url

	return `http://localhost:3000`; // dev SSR should use localhost
}

function constructPaginationSearchParams(currentParams: ReadonlyURLSearchParams, newParams: PaginationSearchParams) {
	const searchParams = new URLSearchParams();

	const page = newParams.page ?? currentParams.get("page") ?? undefined;
	const limit = newParams.limit ?? currentParams.get("limit") ?? undefined;
	const sortBy = newParams.sortBy ?? currentParams.get("orderBy") ?? undefined;
	const sortDirection = newParams.sortDirection ?? currentParams.get("orderDirection") ?? undefined;

	if (page) {
		searchParams.append("page", page.toString());
	}
	if (limit) {
		searchParams.append("limit", limit.toString());
	}
	if (sortBy) {
		searchParams.append("sortBy", sortBy);
	}
	if (sortDirection) {
		searchParams.append("sortDirection", sortDirection);
	}

	return searchParams;
}

type NestedBooleanObject = {
	[key: string]: boolean | Array<boolean | NestedBooleanObject> | NestedBooleanObject;
};

// This function exists to check formState.dirtyFields of a react-hook-form to see if there are any fields that have been changed by the user
// The reason I made this instead of just using formState.isDirty is because they work in different ways.
// SEE: https://github.com/react-hook-form/react-hook-form/issues/4740 - for some ways that isDirty can be weird (imo)
// formState.dirtyFields will include keys with a true value only if the value has been changed by the client or set with keepDirty: true (or equivalent)
// This is good because we then can keep track of actions on the form but not worry about it messing with the dirty state of the form.
// Therefore, imo it is the best way to check if a field has been changed by the user. I don't love this implementation so hopefully there will be a better way soon.
function hasTrueValue(obj: NestedBooleanObject): boolean {
	for (const key in obj) {
		const value = obj[key];

		if (typeof value === "boolean") {
			if (value === true) {
				return true;
			}
		} else if (Array.isArray(value)) {
			for (const item of value) {
				if (typeof item === "boolean" && item === true) {
					return true;
				} else if (typeof item === "object") {
					if (hasTrueValue(item)) {
						return true;
					}
				}
			}
		} else if (typeof value === "object") {
			if (hasTrueValue(value)) {
				return true;
			}
		}
	}

	return false;
}

export {
	type APIResponse,
	cn,
	mergeRelationships,
	generateId,
	getBaseUrl,
	constructPaginationSearchParams,
	hasTrueValue,
};
