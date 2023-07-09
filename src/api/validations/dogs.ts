import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { dogs } from "~/db/drizzle-schema";
import { DogSessionActionLogSchema } from "./dog-sessions";
import { DogToClientRelationshipActionLogSchema } from "./dog-to-client-relationships";
import { DogToVetRelationshipActionLogSchema } from "./dog-to-vet-relationships";
import { IdSchema } from "./utils";

const SelectDogSchema = createSelectSchema(dogs);

const InsertDogSchema = createInsertSchema(dogs)
	.omit({ createdAt: true, updatedAt: true })
	.extend({
		id: IdSchema,
		actions: z.object({
			sessions: DogSessionActionLogSchema,
			dogToClientRelationships: DogToClientRelationshipActionLogSchema,
			dogToVetRelationships: DogToVetRelationshipActionLogSchema,
		}),
	});
type InsertDogSchema = z.infer<typeof InsertDogSchema>;

const UpdateDogSchema = InsertDogSchema.partial().extend({
	id: IdSchema,
});
type UpdateDogSchema = z.infer<typeof UpdateDogSchema>;

export { SelectDogSchema, InsertDogSchema, UpdateDogSchema };
