import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { dogs } from "~/server/db/schemas";
import { DogSessionActionsLogSchema } from "./dog-sessions";
import { DogToClientRelationshipActionsLogSchema } from "./dog-to-client-relationships";
import { DogToVetRelationshipActionsLogSchema } from "./dog-to-vet-relationships";
import { IdSchema } from "./utils";

const SelectDogSchema = createSelectSchema(dogs);

const InsertDogSchema = createInsertSchema(dogs)
	.omit({ createdAt: true, updatedAt: true })
	.extend({
		id: IdSchema,
		actions: z.object({
			sessions: DogSessionActionsLogSchema,
			dogToClientRelationships: DogToClientRelationshipActionsLogSchema,
			dogToVetRelationships: DogToVetRelationshipActionsLogSchema,
		}),
	});
type InsertDogSchema = z.infer<typeof InsertDogSchema>;

const UpdateDogSchema = InsertDogSchema.partial().extend({
	id: IdSchema,
});
type UpdateDogSchema = z.infer<typeof UpdateDogSchema>;

export { SelectDogSchema, InsertDogSchema, UpdateDogSchema };
