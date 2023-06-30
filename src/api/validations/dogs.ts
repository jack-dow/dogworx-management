import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { dogs } from "~/db/drizzle-schema";
import { DogClientRelationshipActionLogSchema } from "./dog-client-relationships";
import { DogSessionHistoryActionLogSchema } from "./dog-session-history";
import { IdSchema } from "./utils";

const SelectDogSchema = createSelectSchema(dogs);

const InsertDogSchema = createInsertSchema(dogs)
	.omit({ createdAt: true, updatedAt: true })
	.extend({
		id: IdSchema,
		actions: z.object({
			clientRelationships: DogClientRelationshipActionLogSchema,
			sessionHistory: DogSessionHistoryActionLogSchema,
		}),
	});
type InsertDogSchema = z.infer<typeof InsertDogSchema>;

const UpdateDogSchema = InsertDogSchema.partial().extend({
	id: IdSchema,
});
type UpdateDogSchema = z.infer<typeof UpdateDogSchema>;

export { SelectDogSchema, InsertDogSchema, UpdateDogSchema };
