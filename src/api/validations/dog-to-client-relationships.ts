import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { type z } from "zod";

import { dogToClientRelationships } from "~/db/drizzle-schema";
import { createActionLogSchema, IdSchema } from "./utils";

const SelectDogToClientRelationshipSchema = createSelectSchema(dogToClientRelationships);

const InsertDogToClientRelationshipSchema = createInsertSchema(dogToClientRelationships)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		dogId: IdSchema,
		clientId: IdSchema,
	});
type InsertDogToClientRelationshipSchema = z.infer<typeof InsertDogToClientRelationshipSchema>;

const UpdateDogToClientRelationshipSchema = InsertDogToClientRelationshipSchema.pick({ id: true, relationship: true });

type UpdateDogToClientRelationshipSchema = z.infer<typeof UpdateDogToClientRelationshipSchema>;

const DogToClientRelationshipActionLogSchema = createActionLogSchema(
	InsertDogToClientRelationshipSchema,
	UpdateDogToClientRelationshipSchema,
);

export {
	SelectDogToClientRelationshipSchema,
	InsertDogToClientRelationshipSchema,
	UpdateDogToClientRelationshipSchema,
	DogToClientRelationshipActionLogSchema,
};
