import { type MutableRefObject, type RefCallback } from "react";
import { type ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { createId } from "@paralleldrive/cuid2";
import { clsx, type ClassValue } from "clsx";
import { asc, desc, type AnyColumn, type InferSelectModel } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import ms from "ms";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

import { type users } from "~/db/schema/auth";
import { env } from "../env.mjs";

// ------------------------------------------------------------------
// Miscellanous
// ------------------------------------------------------------------
export const generateId = createId;

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getBaseUrl(options?: { absolute?: boolean }) {
	if (typeof window !== "undefined") {
		if (options?.absolute) {
			return env.NEXT_PUBLIC_APP_URL;
		}

		return ""; // browser should use relative url
	}
	if (env.VERCEL_URL) return env.VERCEL_URL; // SSR should use vercel url

	return `http://localhost:${env.PORT}`; // dev SSR should use localhost
}

export function secondsToHumanReadable(seconds: number, options?: { nonPlural?: boolean }): string {
	if (seconds === 86400) {
		return "1 day";
	}
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	const formattedTime = [];
	if (hours > 0) {
		formattedTime.push(`${hours} hour${!options?.nonPlural && hours > 1 ? "s" : ""}`);
	}
	if (minutes > 0) {
		formattedTime.push(`${minutes} minute${!options?.nonPlural && minutes > 1 ? "s" : ""}`);
	}
	if (remainingSeconds > 0 || formattedTime.length === 0) {
		formattedTime.push(`${remainingSeconds} second${!options?.nonPlural && remainingSeconds !== 1 ? "s" : ""}`);
	}

	return formattedTime.join(", ");
}

export function logInDevelopment(...args: unknown[]) {
	if (process.env.NODE_ENV === "development") {
		console.log(...args);
	}
}

export type SearchParams = { [key: string]: string | string[] | undefined };

// ------------------------------------------------------------------
// JWTs
// ------------------------------------------------------------------
async function sign<Token extends Record<string, unknown>>(payload: Token) {
	const iat = Math.floor(Date.now() / 1000);

	// Didn't include exp here because jose throws error if exp is passed and we want to be able to access the payload of expired jwt's in middleware
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setIssuedAt(iat)
		.setNotBefore(iat)
		.sign(new TextEncoder().encode(env.JWT_SECRET));
}

async function verify(token: string) {
	return jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET))
		.then((result) => {
			return result.payload;
		})
		.catch(() => {
			return null;
		});
}

export const jwt = {
	sign,
	verify,
};

// ------------------------------------------------------------------
// Auth Cookies
// ------------------------------------------------------------------
export const sessionCookieOptions = {
	name: "__session",
	httpOnly: true,
	maxAge: ms("30d"),
	path: "/",
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
} satisfies Partial<ResponseCookie>;

export type SessionCookiePayload = {
	id: string;
	user: InferSelectModel<typeof users>;
};

export type SessionCookie = SessionCookiePayload & {
	iat: number;
	nbf: number;
};

export const sessionJWTExpiry = 60; // 1 minute

export async function createSessionJWT(payload: SessionCookiePayload) {
	const accessToken = await jwt.sign(payload);

	return accessToken;
}

// ------------------------------------------------------------------
// Auth Zod Validation
// ------------------------------------------------------------------
export const SignInSchema = z.object({
	emailAddress: z.string().email(),
});
export type SignInSchema = z.infer<typeof SignInSchema>;

export const SignUpSchema = SignInSchema.extend({
	givenName: z.string().max(50).nonempty({ message: "Required" }),
	familyName: z.string().max(50).or(z.literal("")).optional(),
});
export type SignUpSchema = z.infer<typeof SignUpSchema>;

// ------------------------------------------------------------------
// React Hook Form
// ------------------------------------------------------------------
type NestedBooleanObject = {
	[key: string]: boolean | Array<boolean | NestedBooleanObject> | NestedBooleanObject;
};

// This function exists to check formState.dirtyFields of a react-hook-form to see if there are any fields that have been changed by the user
// The reason I made this instead of just using formState.isDirty is because they work in different ways.
// SEE: https://github.com/react-hook-form/react-hook-form/issues/4740 - for some ways that isDirty can be weird (imo)
// formState.dirtyFields will include keys with a true value only if the value has been changed by the client or set with keepDirty: true (or equivalent)
// This is good because we then can keep track of actions on the form but not worry about it messing with the dirty state of the form.
// Therefore, imo it is the best way to check if a field has been changed by the user. I don't love this implementation so hopefully there will be a better way soon.
export function hasTrueValue(obj: NestedBooleanObject): boolean {
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

type RefType<T> = MutableRefObject<T> | RefCallback<T> | null;

// ------------------------------------------------------------------
// React Refs
// ------------------------------------------------------------------
export const shareRef =
	<T>(refA: RefType<T | null>, refB: RefType<T | null>): RefCallback<T> =>
	(instance) => {
		if (typeof refA === "function") {
			refA(instance);
		} else if (refA) {
			refA.current = instance;
		}
		if (typeof refB === "function") {
			refB(instance);
		} else if (refB) {
			refB.current = instance;
		}
	};

// ------------------------------------------------------------------
// Zod Validation
// ------------------------------------------------------------------
/** Combine with the rest of the form schema using z.intersection to ensure the super refine is validated at the same time as the rest of the fields */
export const EmailOrPhoneNumberSchema = z
	.object({
		emailAddress: z.string().email().max(128).or(z.literal("")).optional(),
		phoneNumber: z.string().min(9).max(16).or(z.literal("")).optional(),
	})
	.superRefine((val, ctx) => {
		if (!val.emailAddress && !val.phoneNumber) {
			const message = "Email address or phone number required";
			ctx.addIssue({
				code: z.ZodIssueCode.too_small,
				minimum: 1,
				type: "string",
				inclusive: true,
				message: message,
				path: ["emailAddress"],
			});
			ctx.addIssue({
				code: z.ZodIssueCode.too_small,
				minimum: 1,
				type: "string",
				inclusive: true,
				message: message,
				path: ["phoneNumber"],
			});
		}
	});
export type EmailOrPhoneNumberSchema = z.infer<typeof EmailOrPhoneNumberSchema>;

// ------------------------------------------------------------------
// Sortable Columns
// ------------------------------------------------------------------
export type SortableColumns = {
	[key: string]: {
		id: string;
		label: string;
		columns: AnyColumn[];
	};
};

// ------------------------------------------------------------------
// Pagination
// ------------------------------------------------------------------
export function searchParamsToObject(searchParams: URLSearchParams): SearchParams {
	const searchParamsObject: Record<string, string> = {};

	for (const [key, value] of searchParams.entries()) {
		if (value) {
			searchParamsObject[key] = value;
		}
	}

	return searchParamsObject;
}

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
export type PaginationOptionsSchema = z.infer<typeof PaginationOptionsSchema>;

interface ValidatePaginationSearchParamsProps extends PaginationOptionsSchema {
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
