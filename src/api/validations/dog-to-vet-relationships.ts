import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { type z } from "zod";

import { dogToVetRelationships } from "~/server/db/schemas";
import { createActionsLogSchema, IdSchema } from "./utils";

const SelectDogToVetRelationshipSchema = createSelectSchema(dogToVetRelationships);

const InsertDogToVetRelationshipSchema = createInsertSchema(dogToVetRelationships)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		dogId: IdSchema,
		vetId: IdSchema,
	});
type InsertDogToVetRelationshipSchema = z.infer<typeof InsertDogToVetRelationshipSchema>;

const UpdateDogToVetRelationshipSchema = InsertDogToVetRelationshipSchema.pick({ id: true, relationship: true });

type UpdateDogToVetRelationshipSchema = z.infer<typeof UpdateDogToVetRelationshipSchema>;

const DogToVetRelationshipActionsLogSchema = createActionsLogSchema(
	InsertDogToVetRelationshipSchema,
	UpdateDogToVetRelationshipSchema,
);

export {
	SelectDogToVetRelationshipSchema,
	InsertDogToVetRelationshipSchema,
	UpdateDogToVetRelationshipSchema,
	DogToVetRelationshipActionsLogSchema,
};
