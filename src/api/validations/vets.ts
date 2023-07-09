import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { vets } from "~/db/drizzle-schema";
import { DogToVetRelationshipActionLogSchema } from "./dog-to-vet-relationships";
import { IdSchema } from "./utils";
import { VetToVetClinicRelationshipActionLogSchema } from "./vet-to-vet-clinic-relationships";

const SelectVetSchema = createSelectSchema(vets);

const InsertVetSchema = createInsertSchema(vets)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		actions: z.object({
			dogToVetRelationships: DogToVetRelationshipActionLogSchema,
			vetToVetClinicRelationships: VetToVetClinicRelationshipActionLogSchema,
		}),
	});
type InsertVetSchema = z.infer<typeof InsertVetSchema>;

const UpdateVetSchema = InsertVetSchema.partial().extend({
	id: IdSchema,
});
type UpdateVetSchema = z.infer<typeof UpdateVetSchema>;

export { SelectVetSchema, InsertVetSchema, UpdateVetSchema };
