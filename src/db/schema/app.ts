import { relations, sql } from "drizzle-orm";
import { boolean, char, date, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

import { organizations, users } from "./auth";

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
	givenName: varchar("given_name", { length: 50 }).notNull(),
	familyName: varchar("family_name", { length: 100 }),
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
	sessions: many(dogSessions),
	dogToClientRelationships: many(dogToClientRelationships),
	dogToVetRelationships: many(dogToVetRelationships),
	organization: one(organizations, {
		fields: [dogs.organizationId],
		references: [organizations.id],
	}),
}));

// -----------------------------------------------------------------------------
// Dogs Sessions
// -----------------------------------------------------------------------------
const dogSessions = mysqlTable("dog_sessions", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	dogId: char("dog_id", { length: 24 }).notNull(),
	userId: char("user_id", { length: 24 }),
	date: timestamp("date").notNull(),
	details: text("details").notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
});

const dogSessionsRelations = relations(dogSessions, ({ one }) => ({
	dog: one(dogs, {
		fields: [dogSessions.dogId],
		references: [dogs.id],
	}),
	user: one(users, {
		fields: [dogSessions.userId],
		references: [users.id],
	}),
	organization: one(organizations, {
		fields: [dogSessions.organizationId],
		references: [organizations.id],
	}),
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
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
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
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
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
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
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
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
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
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
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
	dogSessions,
	dogSessionsRelations,
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
