<<<<<<< Updated upstream:src/db/schemas/app.ts
import { relations } from "drizzle-orm";
import { boolean, char, date, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
=======
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
>>>>>>> Stashed changes:src/db/schema/app.ts

import { organizations, users } from "./auth";

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
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	givenName: varchar("given_name", { length: 50 }).notNull(),
	breed: varchar("breed", { length: 50 }).notNull(),
	age: date("age").notNull(),
	isAgeEstimate: boolean("is_age_estimate").notNull(),
	sex: mysqlEnum("sex", ["male", "female", "unknown"]).notNull(),
	desexed: boolean("desexed").notNull(),
	color: varchar("color", { length: 50 }).notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	notes: text("notes"),
});

const dogsRelations = relations(dogs, ({ many, one }) => ({
<<<<<<< Updated upstream:src/db/schemas/app.ts
	sessions: many(dogSessions),
=======
	bookings: many(bookings),
>>>>>>> Stashed changes:src/db/schema/app.ts
	dogToClientRelationships: many(dogToClientRelationships),
	dogToVetRelationships: many(dogToVetRelationships),
	organization: one(organizations, {
		fields: [dogs.organizationId],
		references: [organizations.id],
	}),
}));

// -----------------------------------------------------------------------------
// Bookings
// -----------------------------------------------------------------------------
const bookings = mysqlTable("bookings", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	dogId: char("dog_id", { length: 24 }).notNull(),
	createdById: char("created_by_id", { length: 24 }),
	assignedToId: char("assigned_to_id", { length: 24 }),
	date: timestamp("date").notNull(),
	duration: unsignedMediumInt("duration_in_seconds").notNull(),
	details: text("details"),
	organizationId: char("organization_id", { length: 24 }).notNull(),
});

const bookingsRelations = relations(bookings, ({ one }) => ({
	dog: one(dogs, {
		fields: [bookings.dogId],
		references: [dogs.id],
	}),
	createdBy: one(users, {
		fields: [bookings.createdById],
		references: [users.id],
	}),
	assignedTo: one(users, {
		fields: [bookings.assignedToId],
		references: [users.id],
	}),
	organization: one(organizations, {
		fields: [bookings.organizationId],
		references: [organizations.id],
	}),
}));

// -----------------------------------------------------------------------------
// Clients
// -----------------------------------------------------------------------------
const clients = mysqlTable("clients", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	givenName: varchar("given_name", { length: 50 }).notNull(),
	familyName: varchar("family_name", { length: 50 }).notNull().default(""),
	emailAddress: varchar("email_address", { length: 100 }).notNull().default(""),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull().default(""),
	streetAddress: varchar("street_address", { length: 100 }).notNull().default(""),
	city: varchar("city", { length: 50 }).notNull().default(""),
	state: varchar("state", { length: 30 }).notNull().default(""),
	postalCode: varchar("postal_code", { length: 10 }).notNull().default(""),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	notes: text("notes"),
});

const clientsRelations = relations(clients, ({ many, one }) => ({
	dogToClientRelationships: many(dogToClientRelationships),
	organization: one(organizations, {
		fields: [clients.organizationId],
		references: [organizations.id],
	}),
}));

// -----------------------------------------------------------------------------
// Vets
// -----------------------------------------------------------------------------
const vets = mysqlTable("vets", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	givenName: varchar("given_name", { length: 50 }).notNull(),
	familyName: varchar("family_name", { length: 50 }).notNull().default(""),
	emailAddress: varchar("email_address", { length: 100 }).notNull().default(""),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull().default(""),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	notes: text("notes"),
});

const vetsRelations = relations(vets, ({ many, one }) => ({
	dogToVetRelationships: many(dogToVetRelationships),
	vetToVetClinicRelationships: many(vetToVetClinicRelationships),
	organization: one(organizations, {
		fields: [vets.organizationId],
		references: [organizations.id],
	}),
}));

// -----------------------------------------------------------------------------
// Vet Clinics
// -----------------------------------------------------------------------------
const vetClinics = mysqlTable("vet_clinics", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	emailAddress: varchar("email_address", { length: 100 }).notNull().default(""),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull().default(""),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	notes: text("notes"),
});

const vetClinicsRelations = relations(vetClinics, ({ many, one }) => ({
	vetToVetClinicRelationships: many(vetToVetClinicRelationships),
	organization: one(organizations, {
		fields: [vetClinics.organizationId],
		references: [organizations.id],
	}),
}));

// -----------------------------------------------------------------------------
// Dog to Client Relationships
// -----------------------------------------------------------------------------
const dogToClientRelationships = mysqlTable("dog_to_client_relationships", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	dogId: char("dog_id", { length: 24 }).notNull(),
	clientId: char("client_id", { length: 24 }).notNull(),
	relationship: mysqlEnum("relationship", ["owner", "emergency-contact", "fosterer", "groomer"]).notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
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
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	dogId: char("dog_id", { length: 24 }).notNull(),
	vetId: char("vet_id", { length: 24 }).notNull(),
	relationship: mysqlEnum("relationship", ["primary", "secondary"]).notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
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
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	vetId: char("vet_id", { length: 24 }).notNull(),
	vetClinicId: char("vet_clinic_id", { length: 24 }).notNull(),
	relationship: mysqlEnum("relationship", ["full-time", "part-time"]).notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
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
