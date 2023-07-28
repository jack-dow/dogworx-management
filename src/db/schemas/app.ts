import { relations, type InferModel } from "drizzle-orm";
import { boolean, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

import { organizations, users } from "./auth";

// -----------------------------------------------------------------------------
// Dogs
// -----------------------------------------------------------------------------
const dogs = mysqlTable("dogs", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	givenName: varchar("givenName", { length: 64 }).notNull(),
	breed: varchar("breed", { length: 64 }).notNull(),
	age: timestamp("age").notNull(),
	isAgeExact: boolean("is_age_exact").notNull(),
	sex: mysqlEnum("sex", ["male", "female", "unknown"]).notNull(),
	desexed: boolean("desexed").notNull(),
	color: varchar("color", { length: 64 }).notNull(),
	organizationId: varchar("organization_id", { length: 128 }).notNull(),
	notes: text("notes"),
});
type Dog = InferModel<typeof dogs>;

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
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	dogId: varchar("dogId", { length: 128 }).notNull(),
	userId: varchar("userId", { length: 128 }),
	date: timestamp("date").notNull(),
	details: text("details").notNull(),
	organizationId: varchar("organization_id", { length: 128 }).notNull(),
});
type DogSession = InferModel<typeof dogSessions>;

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
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	givenName: varchar("given_name", { length: 64 }).notNull(),
	familyName: varchar("family_name", { length: 64 }).notNull().default(""),
	emailAddress: varchar("email_address", { length: 255 }).notNull().default(""),
	phoneNumber: varchar("phone_number", { length: 28 }).notNull().default(""),
	streetAddress: varchar("street_address", { length: 255 }).notNull().default(""),
	city: varchar("city", { length: 64 }).notNull().default(""),
	state: varchar("state", { length: 64 }).notNull().default(""),
	postalCode: varchar("postal_code", { length: 10 }).notNull().default(""),
	organizationId: varchar("organization_id", { length: 128 }).notNull(),
	notes: text("notes"),
});
type Client = InferModel<typeof clients>;

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
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	givenName: varchar("given_name", { length: 64 }).notNull(),
	familyName: varchar("family_name", { length: 64 }).notNull().default(""),
	emailAddress: varchar("email_address", { length: 255 }).notNull().default(""),
	phoneNumber: varchar("phone_number", { length: 28 }).notNull().default(""),
	organizationId: varchar("organization_id", { length: 128 }).notNull(),
	notes: text("notes"),
});
type Vet = InferModel<typeof vets>;

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
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	name: varchar("name", { length: 64 }).notNull(),
	emailAddress: varchar("email_address", { length: 255 }).notNull().default(""),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull().default(""),
	organizationId: varchar("organization_id", { length: 128 }).notNull(),
	notes: text("notes"),
});
type VetClinic = InferModel<typeof vetClinics>;

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
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	dogId: varchar("dogId", { length: 128 }).notNull(),
	clientId: varchar("clientId", { length: 128 }).notNull(),
	relationship: mysqlEnum("relationship", ["owner", "emergency-contact", "fosterer", "groomer"]).notNull(),
	organizationId: varchar("organization_id", { length: 128 }).notNull(),
});
type DogToClientRelationship = InferModel<typeof dogToClientRelationships>;

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
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	dogId: varchar("dogId", { length: 128 }).notNull(),
	vetId: varchar("vetId", { length: 128 }).notNull(),
	relationship: mysqlEnum("relationship", ["primary", "secondary"]).notNull(),
	organizationId: varchar("organization_id", { length: 128 }).notNull(),
});
type DogToVetRelationship = InferModel<typeof dogToVetRelationships>;

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
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	vetId: varchar("vetId", { length: 128 }).notNull(),
	vetClinicId: varchar("vetClinicId", { length: 128 }).notNull(),
	relationship: mysqlEnum("relationship", ["full-time", "part-time"]).notNull(),
	organizationId: varchar("organization_id", { length: 128 }).notNull(),
});
type VetToVetClinicRelationship = InferModel<typeof vetToVetClinicRelationships>;

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
	type Dog,
	dogSessions,
	dogSessionsRelations,
	type DogSession,
	clients,
	clientsRelations,
	type Client,
	vets,
	vetsRelations,
	type Vet,
	vetClinics,
	vetClinicsRelations,
	type VetClinic,
	dogToClientRelationships,
	dogToClientRelationshipsRelations,
	type DogToClientRelationship,
	dogToVetRelationships,
	dogToVetRelationshipsRelations,
	type DogToVetRelationship,
	vetToVetClinicRelationships,
	vetToVetClinicRelationshipsRelations,
	type VetToVetClinicRelationship,
};
