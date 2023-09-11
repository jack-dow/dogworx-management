import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import {
	bookings,
	bookingTypes,
	clients,
	dogs,
	dogToClientRelationships,
	dogToVetRelationships,
	vetClinics,
	vets,
	vetToVetClinicRelationships,
} from "~/db/schema/app";

// -----------------------------------------------------------------------------
// NOTE: For the update schemas we manually select the fields that can be updated.
// This is because if a new field is added to the schema, we want to be forced to make a conscious decision about whether or not it should be updatable
// to prevent any accidental updates to fields that shouldn't be updatable.
// -----------------------------------------------------------------------------

export const IdSchema = z.string().cuid().length(24);
// Drizzle currently doesn't support unsigned integers out of the box, so we are using a custom type, therefore we also have to manually represent the type in zod
const UnsignedMediumInt = z.number().int().nonnegative().max(16777215);

// Relationship schemas at at the top due to block scoping

// -----------------------------------------------------------------------------
// Dog To Client Relationships
// -----------------------------------------------------------------------------
export const InsertDogToClientRelationshipSchema = createInsertSchema(dogToClientRelationships)
	.extend({
		id: IdSchema,
		dogId: IdSchema,
		clientId: IdSchema,
	})
	.omit({ createdAt: true, updatedAt: true, organizationId: true });
export type InsertDogToClientRelationshipSchema = z.infer<typeof InsertDogToClientRelationshipSchema>;

export const UpdateDogToClientRelationshipSchema = InsertDogToClientRelationshipSchema.pick({
	dogId: true,
	clientId: true,
	relationship: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateDogToClientRelationshipSchema = z.infer<typeof UpdateDogToClientRelationshipSchema>;

// -----------------------------------------------------------------------------
// Dog To Vet Relationships
// -----------------------------------------------------------------------------
export const InsertDogToVetRelationshipSchema = createInsertSchema(dogToVetRelationships)
	.extend({
		id: IdSchema,
		dogId: IdSchema,
		vetId: IdSchema,
	})
	.omit({ createdAt: true, updatedAt: true, organizationId: true });
export type InsertDogToVetRelationshipSchema = z.infer<typeof InsertDogToVetRelationshipSchema>;

export const UpdateDogToVetRelationshipSchema = InsertDogToVetRelationshipSchema.pick({
	id: true,
	dogId: true,
	vetId: true,
	relationship: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateDogToVetRelationshipSchema = z.infer<typeof UpdateDogToVetRelationshipSchema>;

// -----------------------------------------------------------------------------
// Vet to Vet Clinic Relationships
// -----------------------------------------------------------------------------
export const InsertVetToVetClinicRelationshipSchema = createInsertSchema(vetToVetClinicRelationships)
	.extend({
		id: IdSchema,
		vetId: IdSchema,
		vetClinicId: IdSchema,
	})
	.omit({ createdAt: true, updatedAt: true, organizationId: true });
export type InsertVetToVetClinicRelationshipSchema = z.infer<typeof InsertVetToVetClinicRelationshipSchema>;

export const UpdateVetToVetClinicRelationshipSchema = InsertVetToVetClinicRelationshipSchema.pick({
	id: true,
	vetId: true,
	vetClinicId: true,
	relationship: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateVetToVetClinicRelationshipSchema = z.infer<typeof UpdateVetToVetClinicRelationshipSchema>;

// -----------------------------------------------------------------------------
// Bookings
// -----------------------------------------------------------------------------
export const InsertBookingSchema = createInsertSchema(bookings)
	.extend({
		id: IdSchema,
		assignedToId: IdSchema,
		bookingTypeId: IdSchema,
		dogId: IdSchema,
		duration: UnsignedMediumInt,
	})
	.omit({ createdAt: true, updatedAt: true, organizationId: true });

export type InsertBookingSchema = z.infer<typeof InsertBookingSchema>;

export const UpdateBookingSchema = InsertBookingSchema.pick({
	assignedToId: true,
	bookingTypeId: true,
	dogId: true,
	date: true,
	duration: true,
	details: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateBookingSchema = z.infer<typeof UpdateBookingSchema>;

// -----------------------------------------------------------------------------
// Clients
// -----------------------------------------------------------------------------
export const InsertClientSchema = createInsertSchema(clients)
	.extend({
		id: IdSchema,
		dogToClientRelationships: z.array(InsertDogToClientRelationshipSchema).optional(),
	})
	.omit({ createdAt: true, updatedAt: true, organizationId: true });
export type InsertClientSchema = z.infer<typeof InsertClientSchema>;

export const UpdateClientSchema = InsertClientSchema.pick({
	givenName: true,
	familyName: true,
	emailAddress: true,
	phoneNumber: true,
	streetAddress: true,
	city: true,
	state: true,
	postalCode: true,
	notes: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateClientSchema = z.infer<typeof UpdateClientSchema>;

// -----------------------------------------------------------------------------
// Vets
// -----------------------------------------------------------------------------
export const InsertVetSchema = createInsertSchema(vets)
	.extend({
		id: IdSchema,
		dogToVetRelationships: z.array(InsertDogToVetRelationshipSchema).optional(),
		vetToVetClinicRelationships: z.array(InsertVetToVetClinicRelationshipSchema).optional(),
	})
	.omit({ createdAt: true, updatedAt: true, organizationId: true });
export type InsertVetSchema = z.infer<typeof InsertVetSchema>;

export const UpdateVetSchema = InsertVetSchema.pick({
	givenName: true,
	familyName: true,
	emailAddress: true,
	phoneNumber: true,
	notes: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateVetSchema = z.infer<typeof UpdateVetSchema>;

// -----------------------------------------------------------------------------
// Dogs
// -----------------------------------------------------------------------------
export const InsertDogSchema = createInsertSchema(dogs)
	.extend({
		id: IdSchema,
		bookings: z.array(InsertBookingSchema).optional(),
		dogToClientRelationships: z
			.array(
				InsertDogToClientRelationshipSchema.extend({
					client: createSelectSchema(clients).pick({
						id: true,
						givenName: true,
						familyName: true,
						emailAddress: true,
						phoneNumber: true,
					}),
				}),
			)
			.optional(),
		dogToVetRelationships: z
			.array(
				InsertDogToVetRelationshipSchema.extend({
					vet: createSelectSchema(vets).pick({
						id: true,
						givenName: true,
						familyName: true,
						emailAddress: true,
						phoneNumber: true,
					}),
				}),
			)
			.optional(),
	})
	.omit({
		createdAt: true,
		updatedAt: true,
		organizationId: true,
	});
export type InsertDogSchema = z.infer<typeof InsertDogSchema>;

export const UpdateDogSchema = InsertDogSchema.pick({
	givenName: true,
	familyName: true,
	breed: true,
	age: true,
	isAgeEstimate: true,
	sex: true,
	desexed: true,
	color: true,
	notes: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateDogSchema = z.infer<typeof UpdateDogSchema>;

// -----------------------------------------------------------------------------
// Booking Types
// -----------------------------------------------------------------------------
export const InsertBookingTypeSchema = createInsertSchema(bookingTypes)
	.extend({
		id: IdSchema,
		duration: UnsignedMediumInt,
	})
	.omit({ createdAt: true, updatedAt: true, organizationId: true });
export type InsertBookingTypeSchema = z.infer<typeof InsertBookingTypeSchema>;

export const UpdateBookingTypeSchema = InsertBookingTypeSchema.pick({
	name: true,
	color: true,
	duration: true,
	details: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateBookingTypeSchema = z.infer<typeof UpdateBookingTypeSchema>;

// -----------------------------------------------------------------------------
// Vet Clinics
// -----------------------------------------------------------------------------
export const InsertVetClinicSchema = createInsertSchema(vetClinics)
	.extend({
		id: IdSchema,
		vetToVetClinicRelationships: z.array(InsertVetToVetClinicRelationshipSchema).optional(),
	})
	.omit({ createdAt: true, updatedAt: true, organizationId: true });
export type InsertVetClinicSchema = z.infer<typeof InsertVetClinicSchema>;

export const UpdateVetClinicSchema = InsertVetClinicSchema.pick({
	name: true,
	emailAddress: true,
	phoneNumber: true,
	notes: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateVetClinicSchema = z.infer<typeof UpdateVetClinicSchema>;
