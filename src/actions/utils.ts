/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { z } from "zod";

import { sessionCookieOptions, type SessionCookie } from "~/lib/auth-options";
import { jwt } from "~/lib/jwt";

const SearchTermSchema = z.string();

type ServerActionResponse<Data, Error> =
	| {
			success: true;
			data?: Data;
	  }
	| {
			success: false;
			error: Error;
	  };

type ExtractServerActionData<T extends (...params: any) => Promise<ServerActionResponse<any, any>>> =
	ReturnType<T> extends Promise<ServerActionResponse<infer Data, any>> ? Data : never;

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

async function getUser() {
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

	return sessionTokenData.user;
}

export { type ExtractServerActionData, createServerAction, SearchTermSchema, separateActionsLogSchema, getUser };
