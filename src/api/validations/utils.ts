/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

const IdSchema = z.string().cuid2();
const SearchTermSchema = z.string().optional();

function createActionLogSchema<InsertSchema extends z.ZodObject<any, any>, UpdateSchema extends z.ZodObject<any, any>>(
	InsertSchema: InsertSchema,
	UpdateSchema: UpdateSchema,
) {
	return z.record(
		z.discriminatedUnion("type", [
			z.object({
				type: z.literal("INSERT"),
				payload: InsertSchema,
			}),
			z.object({
				type: z.literal("UPDATE"),
				payload: UpdateSchema,
			}),
			z.object({
				type: z.literal("DELETE"),
				payload: z.string().cuid2(),
			}),
		]),
	);
}

function separateActionLogSchema<
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

export { IdSchema, SearchTermSchema, createActionLogSchema, separateActionLogSchema };
