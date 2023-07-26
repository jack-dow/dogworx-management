import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import {
	clients,
	dogs,
	dogSessions,
	dogToClientRelationships,
	dogToVetRelationships,
	vetClinics,
	vets,
	vetToVetClinicRelationships,
} from "~/db/schemas";
import { createActionsLogSchema, IdSchema } from "./utils";

// Order is different from schema order because of block-scoping

// -----------------------------------------------------------------------------
// Dog To Client Relationships
// -----------------------------------------------------------------------------
export const SelectDogToClientRelationshipSchema = createSelectSchema(dogToClientRelationships);

export const InsertDogToClientRelationshipSchema = createInsertSchema(dogToClientRelationships)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		dogId: IdSchema,
		clientId: IdSchema,
	});
export type InsertDogToClientRelationshipSchema = z.infer<typeof InsertDogToClientRelationshipSchema>;

export const UpdateDogToClientRelationshipSchema = InsertDogToClientRelationshipSchema.pick({
	id: true,
	relationship: true,
});

export type UpdateDogToClientRelationshipSchema = z.infer<typeof UpdateDogToClientRelationshipSchema>;

const DogToClientRelationshipActionsLogSchema = createActionsLogSchema(
	InsertDogToClientRelationshipSchema,
	UpdateDogToClientRelationshipSchema,
);

// -----------------------------------------------------------------------------
// Dog To Vet Relationships
// -----------------------------------------------------------------------------
export const SelectDogToVetRelationshipSchema = createSelectSchema(dogToVetRelationships);

export const InsertDogToVetRelationshipSchema = createInsertSchema(dogToVetRelationships)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		dogId: IdSchema,
		vetId: IdSchema,
	});
export type InsertDogToVetRelationshipSchema = z.infer<typeof InsertDogToVetRelationshipSchema>;

export const UpdateDogToVetRelationshipSchema = InsertDogToVetRelationshipSchema.pick({ id: true, relationship: true });

export type UpdateDogToVetRelationshipSchema = z.infer<typeof UpdateDogToVetRelationshipSchema>;

const DogToVetRelationshipActionsLogSchema = createActionsLogSchema(
	InsertDogToVetRelationshipSchema,
	UpdateDogToVetRelationshipSchema,
);

// -----------------------------------------------------------------------------
// Vet to Vet Clinic Relationships
// -----------------------------------------------------------------------------
export const SelectVetToVetClinicRelationshipSchema = createSelectSchema(vetToVetClinicRelationships);

export const InsertVetToVetClinicRelationshipSchema = createInsertSchema(vetToVetClinicRelationships)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		vetId: IdSchema,
		vetClinicId: IdSchema,
	});
export type InsertVetToVetClinicRelationshipSchema = z.infer<typeof InsertVetToVetClinicRelationshipSchema>;

export const UpdateVetToVetClinicRelationshipSchema = InsertVetToVetClinicRelationshipSchema.pick({
	id: true,
	relationship: true,
});

export type UpdateVetToVetClinicRelationshipSchema = z.infer<typeof UpdateVetToVetClinicRelationshipSchema>;

const VetToVetClinicRelationshipActionsLogSchema = createActionsLogSchema(
	InsertVetToVetClinicRelationshipSchema,
	UpdateVetToVetClinicRelationshipSchema,
);

// -----------------------------------------------------------------------------
// Dog Sessions
// -----------------------------------------------------------------------------
export const SelectDogSessionSchema = createSelectSchema(dogSessions);

export const InsertDogSessionSchema = createInsertSchema(dogSessions)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		dogId: IdSchema,
	});
export type InsertDogSessionSchema = z.infer<typeof InsertDogSessionSchema>;

export const UpdateDogSessionSchema = InsertDogSessionSchema.pick({
	id: true,
	date: true,
	details: true,
	userId: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateDogSessionSchema = z.infer<typeof UpdateDogSessionSchema>;

export const DogSessionActionsLogSchema = createActionsLogSchema(InsertDogSessionSchema, UpdateDogSessionSchema);

// -----------------------------------------------------------------------------
// Dogs
// -----------------------------------------------------------------------------
export const SelectDogSchema = createSelectSchema(dogs);

export const InsertDogSchema = createInsertSchema(dogs)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		actions: z.object({
			sessions: DogSessionActionsLogSchema,
			dogToClientRelationships: DogToClientRelationshipActionsLogSchema,
			dogToVetRelationships: DogToVetRelationshipActionsLogSchema,
		}),
	});
export type InsertDogSchema = z.infer<typeof InsertDogSchema>;

export const UpdateDogSchema = InsertDogSchema.partial().extend({
	id: IdSchema,
});
export type UpdateDogSchema = z.infer<typeof UpdateDogSchema>;

// -----------------------------------------------------------------------------
// Clients
// -----------------------------------------------------------------------------
export const SelectClientSchema = createSelectSchema(clients);

export const InsertClientSchema = createInsertSchema(clients)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		actions: z.object({
			dogToClientRelationships: DogToClientRelationshipActionsLogSchema,
		}),
	});
export type InsertClientSchema = z.infer<typeof InsertClientSchema>;

export const UpdateClientSchema = InsertClientSchema.partial().extend({
	id: IdSchema,
});

export type UpdateClientSchema = z.infer<typeof UpdateClientSchema>;

// -----------------------------------------------------------------------------
// Vets
// -----------------------------------------------------------------------------
export const SelectVetSchema = createSelectSchema(vets);

export const InsertVetSchema = createInsertSchema(vets)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		actions: z.object({
			dogToVetRelationships: DogToVetRelationshipActionsLogSchema,
			vetToVetClinicRelationships: VetToVetClinicRelationshipActionsLogSchema,
		}),
	});
export type InsertVetSchema = z.infer<typeof InsertVetSchema>;

export const UpdateVetSchema = InsertVetSchema.partial().extend({
	id: IdSchema,
});
export type UpdateVetSchema = z.infer<typeof UpdateVetSchema>;

// -----------------------------------------------------------------------------
// Vet Clinics
// -----------------------------------------------------------------------------

export const SelectVetClinicSchema = createSelectSchema(vetClinics);

export const InsertVetClinicSchema = createInsertSchema(vetClinics)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		actions: z.object({
			vetToVetClinicRelationships: VetToVetClinicRelationshipActionsLogSchema,
		}),
	});
export type InsertVetClinicSchema = z.infer<typeof InsertVetClinicSchema>;

export const UpdateVetClinicSchema = InsertVetClinicSchema.partial().extend({
	id: IdSchema,
});
export type UpdateVetClinicSchema = z.infer<typeof UpdateVetClinicSchema>;
