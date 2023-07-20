import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { vetClinics } from "~/db/schemas";
import { IdSchema } from "./utils";
import { VetToVetClinicRelationshipActionsLogSchema } from "./vet-to-vet-clinic-relationships";

const SelectVetClinicSchema = createSelectSchema(vetClinics);

const InsertVetClinicSchema = createInsertSchema(vetClinics)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		actions: z.object({
			vetToVetClinicRelationships: VetToVetClinicRelationshipActionsLogSchema,
		}),
	});
type InsertVetClinicSchema = z.infer<typeof InsertVetClinicSchema>;

const UpdateVetClinicSchema = InsertVetClinicSchema.partial().extend({
	id: IdSchema,
});
type UpdateVetClinicSchema = z.infer<typeof UpdateVetClinicSchema>;

export { SelectVetClinicSchema, InsertVetClinicSchema, UpdateVetClinicSchema };
