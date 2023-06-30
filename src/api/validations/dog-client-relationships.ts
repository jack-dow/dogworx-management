import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { type z } from "zod";

import { dogClientRelationships } from "~/db/drizzle-schema";
import { createActionLogSchema, IdSchema } from "./utils";

const SelectDogClientRelationshipSchema = createSelectSchema(dogClientRelationships);

const InsertDogClientRelationshipSchema = createInsertSchema(dogClientRelationships)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		dogId: IdSchema,
		clientId: IdSchema,
	});
type InsertDogClientRelationshipSchema = z.infer<typeof InsertDogClientRelationshipSchema>;

const UpdateDogClientRelationshipSchema = InsertDogClientRelationshipSchema.pick({ id: true, relationship: true });

type UpdateDogClientRelationshipSchema = z.infer<typeof UpdateDogClientRelationshipSchema>;

const DogClientRelationshipActionLogSchema = createActionLogSchema(
	InsertDogClientRelationshipSchema,
	UpdateDogClientRelationshipSchema,
);

export {
	SelectDogClientRelationshipSchema,
	InsertDogClientRelationshipSchema,
	UpdateDogClientRelationshipSchema,
	DogClientRelationshipActionLogSchema,
};
