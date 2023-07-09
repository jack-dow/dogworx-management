import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { type z } from "zod";

import { dogSessions } from "~/db/drizzle-schema";
import { createActionLogSchema, IdSchema } from "./utils";

const SelectDogSessionSchema = createSelectSchema(dogSessions);

const InsertDogSessionSchema = createInsertSchema(dogSessions).omit({ createdAt: true, updatedAt: true }).extend({
	id: IdSchema,
	dogId: IdSchema,
});
type InsertDogSessionSchema = z.infer<typeof InsertDogSessionSchema>;

const UpdateDogSessionSchema = InsertDogSessionSchema.pick({
	id: true,
	date: true,
	details: true,
	userId: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
type UpdateDogSessionSchema = z.infer<typeof UpdateDogSessionSchema>;

const DogSessionActionLogSchema = createActionLogSchema(InsertDogSessionSchema, UpdateDogSessionSchema);

export { SelectDogSessionSchema, InsertDogSessionSchema, UpdateDogSessionSchema, DogSessionActionLogSchema };
