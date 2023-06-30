import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { clients, dogClientRelationships, dogs, dogSessionHistory } from "./drizzle-schema";

//
// ## Utils
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createActionSchema<InsertSchema extends z.ZodObject<any, any>, UpdateSchema extends z.ZodObject<any, any>>(
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

const IdSchema = z.string().cuid2();

//
// ## Simplified Clerk User Schema used for validation in forms. If you change this schema, you must also change what is passed from server actions to the client.
//
const UserSchema = z.object({
	id: z.string(),
	firstName: z.string().nullable(),
	lastName: z.string().nullable(),
	emailAddresses: z.array(
		z.object({
			id: z.string(),
			emailAddress: z.string(),
		}),
	),
});
export type UserSchema = z.infer<typeof UserSchema>;

//
// ## Dog Client Relationships
//
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

const DogClientRelationshipActionsSchema = createActionSchema(
	InsertDogClientRelationshipSchema,
	UpdateDogClientRelationshipSchema,
);

export { InsertDogClientRelationshipSchema, UpdateDogClientRelationshipSchema };

//
// ## Clients
//
const InsertClientSchema = createInsertSchema(clients)
	.omit({ createdAt: true, updatedAt: true })
	.extend({
		id: IdSchema,
		dogRelationships: z.array(InsertDogClientRelationshipSchema.extend({ dog: createSelectSchema(dogs) })).optional(),
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
		dogRelationships: z.array(InsertDogClientRelationshipSchema.extend({ dog: createSelectSchema(dogs) })).optional(),
		actions: z.object({
			dogRelationships: DogClientRelationshipActionsSchema,
		}),
	});
type UpdateClientSchema = z.infer<typeof UpdateClientSchema>;

export { InsertClientSchema, UpdateClientSchema };

//
// ## Dog Session History
//
const InsertDogSessionHistorySchema = createInsertSchema(dogSessionHistory)
	.omit({ createdAt: true, updatedAt: true })
	.extend({
		id: IdSchema,
		user: UserSchema,
	});
type InsertDogSessionHistorySchema = z.infer<typeof InsertDogSessionHistorySchema>;

const UpdateDogSessionHistorySchema = createInsertSchema(dogSessionHistory)
	.omit({ createdAt: true, updatedAt: true })
	.partial()
	.extend({
		id: IdSchema,
		user: UserSchema.optional(),
	});
type UpdateDogSessionHistorySchema = z.infer<typeof UpdateDogSessionHistorySchema>;

export { InsertDogSessionHistorySchema, UpdateDogSessionHistorySchema };

//
// ## Dogs
//
const DogSessionHistoryActionsSchema = createActionSchema(InsertDogSessionHistorySchema, UpdateDogSessionHistorySchema);

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
		clientRelationships: z
			.array(InsertDogClientRelationshipSchema.extend({ client: ClientWithDogRelationshipsSchema }))
			.optional(),
		sessionHistory: z.array(InsertDogSessionHistorySchema).optional(),
		actions: z.object({
			clientRelationships: DogClientRelationshipActionsSchema,
			sessionHistory: DogSessionHistoryActionsSchema,
		}),
	});
type InsertDogSchema = z.infer<typeof InsertDogSchema>;

const UpdateDogSchema = createInsertSchema(dogs)
	.omit({ createdAt: true, updatedAt: true })
	.partial()
	.extend({
		id: IdSchema,
		clientRelationships: z
			.array(InsertDogClientRelationshipSchema.extend({ client: ClientWithDogRelationshipsSchema }))
			.optional(),
		sessionHistory: z.array(InsertDogSessionHistorySchema).optional(),
		actions: z.object({
			clientRelationships: DogClientRelationshipActionsSchema,
			sessionHistory: DogSessionHistoryActionsSchema,
		}),
	});
type UpdateDogSchema = z.infer<typeof UpdateDogSchema>;

export { InsertDogSchema, UpdateDogSchema };
