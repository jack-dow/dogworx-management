import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { type z } from "zod";

import { vetToVetClinicRelationships } from "~/server/db/schemas";
import { createActionsLogSchema, IdSchema } from "./utils";

const SelectVetToVetClinicRelationshipSchema = createSelectSchema(vetToVetClinicRelationships);

const InsertVetToVetClinicRelationshipSchema = createInsertSchema(vetToVetClinicRelationships)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		vetId: IdSchema,
		vetClinicId: IdSchema,
	});
type InsertVetToVetClinicRelationshipSchema = z.infer<typeof InsertVetToVetClinicRelationshipSchema>;

const UpdateVetToVetClinicRelationshipSchema = InsertVetToVetClinicRelationshipSchema.pick({
	id: true,
	relationship: true,
});

type UpdateVetToVetClinicRelationshipSchema = z.infer<typeof UpdateVetToVetClinicRelationshipSchema>;

const VetToVetClinicRelationshipActionsLogSchema = createActionsLogSchema(
	InsertVetToVetClinicRelationshipSchema,
	UpdateVetToVetClinicRelationshipSchema,
);

export {
	SelectVetToVetClinicRelationshipSchema,
	InsertVetToVetClinicRelationshipSchema,
	UpdateVetToVetClinicRelationshipSchema,
	VetToVetClinicRelationshipActionsLogSchema,
};
