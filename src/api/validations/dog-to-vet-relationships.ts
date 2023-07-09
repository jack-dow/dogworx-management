import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { type z } from "zod";

import { dogToVetRelationships } from "~/db/drizzle-schema";
import { createActionLogSchema, IdSchema } from "./utils";

const SelectDogToVetRelationshipSchema = createSelectSchema(dogToVetRelationships);

const InsertDogToVetRelationshipSchema = createInsertSchema(dogToVetRelationships)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		dogId: IdSchema,
		clientId: IdSchema,
	});
type InsertDogToVetRelationshipSchema = z.infer<typeof InsertDogToVetRelationshipSchema>;

const UpdateDogToVetRelationshipSchema = InsertDogToVetRelationshipSchema.pick({ id: true, relationship: true });

type UpdateDogToVetRelationshipSchema = z.infer<typeof UpdateDogToVetRelationshipSchema>;

const DogToVetRelationshipActionLogSchema = createActionLogSchema(
	InsertDogToVetRelationshipSchema,
	UpdateDogToVetRelationshipSchema,
);

export {
	SelectDogToVetRelationshipSchema,
	InsertDogToVetRelationshipSchema,
	UpdateDogToVetRelationshipSchema,
	DogToVetRelationshipActionLogSchema,
};
