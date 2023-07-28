/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

const IdSchema = z.string().cuid2();

function createActionsLogSchema<InsertSchema extends z.ZodObject<any, any>, UpdateSchema extends z.ZodObject<any, any>>(
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



export { IdSchema, createActionsLogSchema };
