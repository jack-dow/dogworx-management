import { relations, sql } from "drizzle-orm";
import {
	boolean,
	char,
	customType,
	date,
	mysqlEnum,
	mysqlTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/mysql-core";

import { organizations, users } from "./auth";

// -----------------------------------------------------------------------------
// NOTE: As Planetscale does not support foreign keys, table rows that represent a relationship to another table
// should not be marked with notNull() even though they should not be null, as we want the types to show that
// they can reference an id of a resource that has been deleted (which means trying to access that id will return null).
// Instead the not null relationship should be enforced in zod validation (SEE ../validation).
// The only exception to this is the organization_id field, as the only people who could potentially
// try to query an organization id that no longer exists is a developer account in the organization with id 1.
// -----------------------------------------------------------------------------

// Drizzle currently doesn't support unsigned integers out of the box, so we are using a custom type.
const unsignedMediumInt = customType<{
	data: number;
	driverData: number;
}>({
	dataType() {
		return "mediumint unsigned";
	},
	fromDriver(data: number) {
		return data;
	},
});

// -----------------------------------------------------------------------------
// Dogs
// -----------------------------------------------------------------------------
const dogs = mysqlTable("dogs", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	givenName: varchar("given_name", { length: 50 }).notNull(),
	familyName: varchar("family_name", { length: 100 }),
	breed: varchar("breed", { length: 50 }).notNull(),
	age: date("age").notNull(),
	isAgeEstimate: boolean("is_age_estimate").notNull(),
	sex: mysqlEnum("sex", ["male", "female", "unknown"]).notNull(),
	desexed: boolean("desexed").notNull(),
	color: varchar("color", { length: 50 }).notNull(),
	notes: text("notes"),
});

const dogsRelations = relations(dogs, ({ many, one }) => ({
	organization: one(organizations, {
		fields: [dogs.organizationId],
		references: [organizations.id],
	}),
	bookings: many(bookings),
	dogToClientRelationships: many(dogToClientRelationships),
	dogToVetRelationships: many(dogToVetRelationships),
}));

// -----------------------------------------------------------------------------
// Bookings
// -----------------------------------------------------------------------------
const bookings = mysqlTable("bookings", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	assignedToId: char("assigned_to_id", { length: 24 }).notNull(),
	bookingTypeId: char("booking_type_id", { length: 24 }),
	dogId: char("dog_id", { length: 24 }),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	date: timestamp("date").notNull(),
	duration: unsignedMediumInt("duration_in_seconds").notNull(),
	details: text("details"),
});

const bookingsRelations = relations(bookings, ({ one }) => ({
	assignedTo: one(users, {
		fields: [bookings.assignedToId],
		references: [users.id],
	}),
	bookingType: one(bookingTypes, {
		fields: [bookings.bookingTypeId],
		references: [bookingTypes.id],
	}),
	dog: one(dogs, {
		fields: [bookings.dogId],
		references: [dogs.id],
	}),
	organization: one(organizations, {
		fields: [bookings.organizationId],
		references: [organizations.id],
	}),
}));

// -----------------------------------------------------------------------------
// Booking Types
// -----------------------------------------------------------------------------
const bookingTypes = mysqlTable("booking_types", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	color: varchar("color", { length: 7 }).notNull(),
	duration: unsignedMediumInt("duration_in_seconds").notNull(),
	details: text("details"),
	showDetailsInCalendar: boolean("show_details_in_calendar").notNull().default(false),
	isDefault: boolean("is_default").notNull().default(false),
});

const bookingTypesRelations = relations(bookingTypes, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [bookingTypes.organizationId],
		references: [organizations.id],
	}),
	bookings: many(bookings),
}));

// -----------------------------------------------------------------------------
// Clients
// -----------------------------------------------------------------------------
const clients = mysqlTable("clients", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	givenName: varchar("given_name", { length: 50 }).notNull(),
	familyName: varchar("family_name", { length: 50 }).notNull().default(""),
	emailAddress: varchar("email_address", { length: 100 }).notNull().default(""),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull().default(""),
	streetAddress: varchar("street_address", { length: 100 }).notNull().default(""),
	city: varchar("city", { length: 50 }).notNull().default(""),
	state: varchar("state", { length: 30 }).notNull().default(""),
	postalCode: varchar("postal_code", { length: 10 }).notNull().default(""),
	notes: text("notes"),
});

const clientsRelations = relations(clients, ({ many, one }) => ({
	organization: one(organizations, {
		fields: [clients.organizationId],
		references: [organizations.id],
	}),
	dogToClientRelationships: many(dogToClientRelationships),
}));

// -----------------------------------------------------------------------------
// Vets
// -----------------------------------------------------------------------------
const vets = mysqlTable("vets", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	givenName: varchar("given_name", { length: 50 }).notNull(),
	familyName: varchar("family_name", { length: 50 }).notNull().default(""),
	emailAddress: varchar("email_address", { length: 100 }).notNull().default(""),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull().default(""),
	notes: text("notes"),
});

const vetsRelations = relations(vets, ({ many, one }) => ({
	organization: one(organizations, {
		fields: [vets.organizationId],
		references: [organizations.id],
	}),
	dogToVetRelationships: many(dogToVetRelationships),
	vetToVetClinicRelationships: many(vetToVetClinicRelationships),
}));

// -----------------------------------------------------------------------------
// Vet Clinics
// -----------------------------------------------------------------------------
const vetClinics = mysqlTable("vet_clinics", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	emailAddress: varchar("email_address", { length: 100 }).notNull().default(""),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull().default(""),
	notes: text("notes"),
});

const vetClinicsRelations = relations(vetClinics, ({ many, one }) => ({
	organization: one(organizations, {
		fields: [vetClinics.organizationId],
		references: [organizations.id],
	}),
	vetToVetClinicRelationships: many(vetToVetClinicRelationships),
}));

// -----------------------------------------------------------------------------
// Dog to Client Relationships
// -----------------------------------------------------------------------------
const dogToClientRelationships = mysqlTable("dog_to_client_relationships", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	dogId: char("dog_id", { length: 24 }).notNull(),
	clientId: char("client_id", { length: 24 }).notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	relationship: mysqlEnum("relationship", ["owner", "emergency-contact", "fosterer", "groomer"]).notNull(),
});

const dogToClientRelationshipsRelations = relations(dogToClientRelationships, ({ one }) => ({
	dog: one(dogs, {
		fields: [dogToClientRelationships.dogId],
		references: [dogs.id],
	}),
	client: one(clients, {
		fields: [dogToClientRelationships.clientId],
		references: [clients.id],
	}),
	organization: one(organizations, {
		fields: [dogToClientRelationships.organizationId],
		references: [organizations.id],
	}),
}));

// -----------------------------------------------------------------------------
// Dog to Vet Relationships
// -----------------------------------------------------------------------------
const dogToVetRelationships = mysqlTable("dog_to_vet_relationships", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	dogId: char("dog_id", { length: 24 }).notNull(),
	vetId: char("vet_id", { length: 24 }).notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	relationship: mysqlEnum("relationship", ["primary", "secondary"]).notNull(),
});

const dogToVetRelationshipsRelations = relations(dogToVetRelationships, ({ one }) => ({
	vet: one(vets, {
		fields: [dogToVetRelationships.vetId],
		references: [vets.id],
	}),
	dog: one(dogs, {
		fields: [dogToVetRelationships.dogId],
		references: [dogs.id],
	}),
	organization: one(organizations, {
		fields: [dogToVetRelationships.organizationId],
		references: [organizations.id],
	}),
}));

// -----------------------------------------------------------------------------
// Vet to Vet Clinic Relationships
// -----------------------------------------------------------------------------
const vetToVetClinicRelationships = mysqlTable("vet_to_vet_clinic_relationships", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	vetId: char("vet_id", { length: 24 }).notNull(),
	vetClinicId: char("vet_clinic_id", { length: 24 }).notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	relationship: mysqlEnum("relationship", ["full-time", "part-time"]).notNull(),
});

const vetToVetClinicRelationshipsRelations = relations(vetToVetClinicRelationships, ({ one }) => ({
	vet: one(vets, {
		fields: [vetToVetClinicRelationships.vetId],
		references: [vets.id],
	}),
	vetClinic: one(vetClinics, {
		fields: [vetToVetClinicRelationships.vetClinicId],
		references: [vetClinics.id],
	}),
	organization: one(organizations, {
		fields: [vetToVetClinicRelationships.organizationId],
		references: [organizations.id],
	}),
}));

export {
	dogs,
	dogsRelations,
	bookings,
	bookingsRelations,
	bookingTypes,
	bookingTypesRelations,
	clients,
	clientsRelations,
	vets,
	vetsRelations,
	vetClinics,
	vetClinicsRelations,
	dogToClientRelationships,
	dogToClientRelationshipsRelations,
	dogToVetRelationships,
	dogToVetRelationshipsRelations,
	vetToVetClinicRelationships,
	vetToVetClinicRelationshipsRelations,
};
