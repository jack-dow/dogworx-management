/* eslint-disable @typescript-eslint/no-explicit-any */
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";

const generateId = createId;

const SearchTermSchema = z.string().optional();

type RouterResponse<Data, Error> =
	| {
			success: true;
			data?: Data;
	  }
	| {
			success: false;
			error: Error;
	  };

function createRouterResponse<Fn extends (...params: any) => Promise<RouterResponse<any, z.ZodIssue[] | string>>>(
	fn: Fn,
) {
	return fn;
}

function separateActionSchema<
	ActionSchema extends Record<
		string,
		{ type: "INSERT"; payload: any } | { type: "UPDATE"; payload: any } | { type: "DELETE"; payload: any }
	>,
>(actionSchema: ActionSchema) {
	type Insert = Extract<ActionSchema[keyof ActionSchema], { type: "INSERT" }>["payload"];
	type Update = Extract<ActionSchema[keyof ActionSchema], { type: "UPDATE" }>["payload"];
	type Delete = Extract<ActionSchema[keyof ActionSchema], { type: "DELETE" }>["payload"];

	const inserts: Array<Insert> = [];
	const updates: Array<Update> = [];
	const deletes: Array<Delete> = [];

	for (const action of Object.values(actionSchema)) {
		if (action.type === "INSERT") {
			inserts.push(action.payload as Insert);
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

export { generateId, SearchTermSchema, createRouterResponse, separateActionSchema };
