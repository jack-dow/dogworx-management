import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { vetClinics } from "~/db/drizzle-schema";
import { IdSchema } from "./utils";
import { VetToVetClinicRelationshipActionLogSchema } from "./vet-to-vet-clinic-relationships";

const SelectVetClinicSchema = createSelectSchema(vetClinics);

const InsertVetClinicSchema = createInsertSchema(vetClinics)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		actions: z.object({
			vetToVetClinicRelationships: VetToVetClinicRelationshipActionLogSchema,
		}),
	});
type InsertVetClinicSchema = z.infer<typeof InsertVetClinicSchema>;

const UpdateVetClinicSchema = InsertVetClinicSchema.partial().extend({
	id: IdSchema,
});
type UpdateVetClinicSchema = z.infer<typeof UpdateVetClinicSchema>;

export { SelectVetClinicSchema, InsertVetClinicSchema, UpdateVetClinicSchema };
