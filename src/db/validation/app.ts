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
} from "~/db/schema";
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
// Bookings
// -----------------------------------------------------------------------------
export const SelectBookingSchema = createSelectSchema(bookings);

export const InsertBookingSchema = createInsertSchema(bookings)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		dogId: IdSchema.nullable(),
		bookingTypeId: IdSchema.nullable(),
		duration: z.number().int().nonnegative().default(0),
	});
export type InsertBookingSchema = z.infer<typeof InsertBookingSchema>;

export const UpdateBookingSchema = InsertBookingSchema.partial().extend({
	id: IdSchema,
});
export type UpdateBookingSchema = z.infer<typeof UpdateBookingSchema>;

export const BookingActionsLogSchema = createActionsLogSchema(InsertBookingSchema, UpdateBookingSchema);

// -----------------------------------------------------------------------------
// Booking Types
// -----------------------------------------------------------------------------
export const SelectBookingTypeSchema = createSelectSchema(bookingTypes);

export const InsertBookingTypeSchema = createInsertSchema(bookingTypes)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		duration: z.number().int().nonnegative().default(0),
	});
export type InsertBookingTypeSchema = z.infer<typeof InsertBookingTypeSchema>;

export const UpdateBookingTypeSchema = InsertBookingTypeSchema.partial().extend({
	id: IdSchema,
});
export type UpdateBookingTypeSchema = z.infer<typeof UpdateBookingTypeSchema>;

// -----------------------------------------------------------------------------
// Clients
// -----------------------------------------------------------------------------
export const SelectClientSchema = createSelectSchema(clients);

export const InsertClientSchema = createInsertSchema(clients)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		dogToClientRelationships: z.array(
			InsertDogToClientRelationshipSchema.extend({
				dog: createSelectSchema(dogs).pick({
					id: true,
					givenName: true,
					familyName: true,
					color: true,
					breed: true,
				}),
			}),
		),
		actions: z.object({
			dogToClientRelationships: DogToClientRelationshipActionsLogSchema,
		}),
	});
export type InsertClientSchema = z.infer<typeof InsertClientSchema>;

export const UpdateClientSchema = InsertClientSchema.partial().extend({
	id: IdSchema,
	dogToClientRelationships: z.array(
		InsertDogToClientRelationshipSchema.extend({
			dog: createSelectSchema(dogs).pick({
				id: true,
				givenName: true,
				familyName: true,
				color: true,
				breed: true,
			}),
		}),
	),
});

export type UpdateClientSchema = z.infer<typeof UpdateClientSchema>;

// -----------------------------------------------------------------------------
// Dogs
// -----------------------------------------------------------------------------
export const SelectDogSchema = createSelectSchema(dogs);

export const InsertDogSchema = createInsertSchema(dogs)
	.omit({ createdAt: true, updatedAt: true, organizationId: true })
	.extend({
		id: IdSchema,
		dogToClientRelationships: z.array(
			InsertDogToClientRelationshipSchema.extend({
				client: SelectClientSchema.pick({
					id: true,
					givenName: true,
					familyName: true,
					emailAddress: true,
					phoneNumber: true,
				}),
			}),
		),
		actions: z.object({
			bookings: BookingActionsLogSchema,
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
