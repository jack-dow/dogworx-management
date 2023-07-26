import { createId } from "@paralleldrive/cuid2";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type z } from "zod";

type DefaultErrorCodes = "InvalidBody" | "UnknownError";

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

const getBaseUrl = () => {
	if (typeof window !== "undefined") return ""; // browser should use relative url
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url

	return `http://localhost:3000`; // dev SSR should use localhost
};

export { type APIResponse, cn, mergeRelationships, generateId, getBaseUrl };
