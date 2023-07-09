import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { clients } from "~/db/drizzle-schema";
import { DogToClientRelationshipActionLogSchema } from "./dog-to-client-relationships";
import { IdSchema } from "./utils";

const SelectClientSchema = createSelectSchema(clients);

const InsertClientSchema = createInsertSchema(clients)
	.omit({ createdAt: true, updatedAt: true })
	.extend({
		id: IdSchema,
		actions: z.object({
			dogToClientRelationships: DogToClientRelationshipActionLogSchema,
		}),
	});
type InsertClientSchema = z.infer<typeof InsertClientSchema>;

const UpdateClientSchema = InsertClientSchema.partial().extend({
	id: IdSchema,
});

type UpdateClientSchema = z.infer<typeof UpdateClientSchema>;

export { SelectClientSchema, InsertClientSchema, UpdateClientSchema };
