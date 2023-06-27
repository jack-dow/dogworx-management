import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { clients, dogClientRelationships, dogs } from "./drizzle-schema";

const IdSchema = z.string().cuid2();

const InsertDogClientRelationshipSchema = createInsertSchema(dogClientRelationships)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
	});
type InsertDogClientRelationshipSchema = z.infer<typeof InsertDogClientRelationshipSchema>;

const UpdateDogClientRelationshipSchema = createInsertSchema(dogClientRelationships)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.partial()
	.extend({
		id: IdSchema,
	});
type UpdateDogClientRelationshipSchema = z.infer<typeof UpdateDogClientRelationshipSchema>;

const DogClientRelationshipActionsSchema = z.record(
	z.discriminatedUnion("type", [
		z.object({
			type: z.literal("INSERT"),
			payload: InsertDogClientRelationshipSchema,
		}),
		z.object({
			type: z.literal("UPDATE"),
			payload: UpdateDogClientRelationshipSchema,
		}),
		z.object({
			type: z.literal("DELETE"),
			payload: z.string().cuid2(),
		}),
	]),
);

export { InsertDogClientRelationshipSchema, UpdateDogClientRelationshipSchema };

const InsertClientSchema = createInsertSchema(clients)
	.omit({ createdAt: true, updatedAt: true })
	.extend({
		id: IdSchema,
		dogRelationships: z.array(InsertDogClientRelationshipSchema.extend({ dog: createSelectSchema(dogs) })),
		actions: z.object({
			dogRelationships: DogClientRelationshipActionsSchema,
		}),
	});
type InsertClientSchema = z.infer<typeof InsertClientSchema>;

const UpdateClientSchema = createInsertSchema(clients)
	.omit({ createdAt: true, updatedAt: true })
	.partial()
	.extend({
		id: IdSchema,
		dogRelationships: z.array(InsertDogClientRelationshipSchema.extend({ dog: createSelectSchema(dogs) })),
		actions: z.object({
			dogRelationships: DogClientRelationshipActionsSchema,
		}),
	});
type UpdateClientSchema = z.infer<typeof UpdateClientSchema>;

export { InsertClientSchema, UpdateClientSchema };

const ClientWithDogRelationshipsSchema = createSelectSchema(clients).extend({
	dogRelationships: z.array(
		createSelectSchema(dogClientRelationships).extend({
			dog: createSelectSchema(dogs),
		}),
	),
});

const InsertDogSchema = createInsertSchema(dogs)
	.omit({ createdAt: true, updatedAt: true })
	.extend({
		id: IdSchema,
		clientRelationships: z.array(
			InsertDogClientRelationshipSchema.extend({ client: ClientWithDogRelationshipsSchema }),
		),
		actions: z.object({
			clientRelationships: DogClientRelationshipActionsSchema,
		}),
	});
type InsertDogSchema = z.infer<typeof InsertDogSchema>;

const UpdateDogSchema = createInsertSchema(dogs)
	.omit({ createdAt: true, updatedAt: true })
	.partial()
	.extend({
		id: IdSchema,
		clientRelationships: z.array(
			InsertDogClientRelationshipSchema.extend({ client: ClientWithDogRelationshipsSchema }),
		),
		actions: z.object({
			clientRelationships: DogClientRelationshipActionsSchema,
		}),
	});
type UpdateDogSchema = z.infer<typeof UpdateDogSchema>;

export { InsertDogSchema, UpdateDogSchema };
