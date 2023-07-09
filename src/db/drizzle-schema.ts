import { relations, type InferModel } from "drizzle-orm";
import { boolean, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

//
// ## Dogs
//
const dogs = mysqlTable("dogs", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	givenName: varchar("givenName", { length: 50 }).notNull(),
	breed: varchar("breed", { length: 100 }).notNull(),
	age: timestamp("age").notNull(),
	isAgeExact: boolean("is_age_exact").notNull(),
	sex: mysqlEnum("sex", ["male", "female", "unknown"]).notNull(),
	desexed: boolean("desexed").notNull(),
	color: varchar("city", { length: 50 }).notNull(),
	notes: text("notes"),
});
type Dog = InferModel<typeof dogs>;

const dogsRelations = relations(dogs, ({ many }) => ({
	sessions: many(dogSessions),
	dogToClientRelationships: many(dogToClientRelationships),
	dogToVetRelationships: many(dogToVetRelationships),
}));

//
// ## Dog Session History
//
const dogSessions = mysqlTable("dog_sessions", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	dogId: varchar("dogId", { length: 128 }).notNull(),
	userId: varchar("userId", { length: 128 }).notNull(),
	date: timestamp("date").notNull(),
	details: text("details").notNull(),
});
type DogSession = InferModel<typeof dogSessions>;

const dogSessionsRelations = relations(dogSessions, ({ one }) => ({
	dog: one(dogs, {
		fields: [dogSessions.dogId],
		references: [dogs.id],
	}),
}));

//
// ## Clients
//
const clients = mysqlTable("clients", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	givenName: varchar("given_name", { length: 50 }).notNull(),
	familyName: varchar("family_name", { length: 50 }).notNull().default(""),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	emailAddress: varchar("email_address", { length: 256 }).notNull(),
	streetAddress: varchar("street_address", { length: 256 }).notNull(),
	city: varchar("city", { length: 50 }).notNull(),
	state: varchar("state", { length: 50 }).notNull(),
	postalCode: varchar("postal_code", { length: 10 }).notNull(),
	notes: text("notes"),
});
type Client = InferModel<typeof clients>;

const clientsRelations = relations(clients, ({ many }) => ({
	dogToClientRelationships: many(dogToClientRelationships),
}));

//
// ## Vets
//
const vets = mysqlTable("vets", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	givenName: varchar("given_name", { length: 50 }).notNull(),
	familyName: varchar("family_name", { length: 50 }).notNull().default(""),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	emailAddress: varchar("email_address", { length: 256 }).notNull(),
	notes: text("notes"),
});
type Vet = InferModel<typeof vets>;

const vetsRelations = relations(vets, ({ many }) => ({
	dogToVetRelationships: many(dogToVetRelationships),
	vetToVetClinicRelationships: many(vetToVetClinicRelationships),
}));

//
// ## Vet Clinics
//
const vetClinics = mysqlTable("vet_clinics", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	emailAddress: varchar("email_address", { length: 256 }).notNull(),
	notes: text("notes"),
});
type VetClinic = InferModel<typeof vetClinics>;

const vetClinicsRelations = relations(vetClinics, ({ many }) => ({
	vetToVetClinicRelationships: many(vetToVetClinicRelationships),
}));

//
// ## Dog to Client Relationships
//
const dogToClientRelationships = mysqlTable("dog_to_client_relationships", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	dogId: varchar("dogId", { length: 128 }).notNull(),
	clientId: varchar("clientId", { length: 128 }).notNull(),
	relationship: mysqlEnum("relationship", ["owner", "emergency-contact", "fosterer", "groomer"]).notNull(),
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
}));

//
// ## Dog to Vet Relationships
//
const dogToVetRelationships = mysqlTable("dog_to_vet_relationships", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	dogId: varchar("dogId", { length: 128 }).notNull(),
	vetId: varchar("vetId", { length: 128 }).notNull(),
	relationship: mysqlEnum("relationship", ["primary", "secondary"]).notNull(),
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
}));

//
// ## Vet to Vet Clinic Relationships
//
const vetToVetClinicRelationships = mysqlTable("vet_to_vet_clinic_relationships", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	vetId: varchar("vetId", { length: 128 }).notNull(),
	vetClinicId: varchar("vetClinicId", { length: 128 }).notNull(),
	relationship: mysqlEnum("relationship", ["full-time", "part-time"]).notNull(),
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
