import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { type z } from "zod";

import { dogSessionHistory } from "~/db/drizzle-schema";
import { createActionLogSchema, IdSchema } from "./utils";

const SelectDogSessionHistorySchema = createSelectSchema(dogSessionHistory);

const InsertDogSessionHistorySchema = createInsertSchema(dogSessionHistory)
	.omit({ createdAt: true, updatedAt: true })
	.extend({
		id: IdSchema,
		dogId: IdSchema,
	});
type InsertDogSessionHistorySchema = z.infer<typeof InsertDogSessionHistorySchema>;

const UpdateDogSessionHistorySchema = InsertDogSessionHistorySchema.pick({ id: true, date: true, details: true })
	.partial()
	.extend({
		id: IdSchema,
	});
type UpdateDogSessionHistorySchema = z.infer<typeof UpdateDogSessionHistorySchema>;

const DogSessionHistoryActionLogSchema = createActionLogSchema(
	InsertDogSessionHistorySchema,
	UpdateDogSessionHistorySchema,
);

export {
	SelectDogSessionHistorySchema,
	InsertDogSessionHistorySchema,
	UpdateDogSessionHistorySchema,
	DogSessionHistoryActionLogSchema,
};
