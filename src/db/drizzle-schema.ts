import { relations, type InferModel } from "drizzle-orm";
import { boolean, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

import { type UserSchema } from "./drizzle-zod";

//
// ## Dog Client Relationships
//
const dogClientRelationships = mysqlTable("dog_client_relationships", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	dogId: varchar("dogId", { length: 128 }).notNull(),
	clientId: varchar("clientId", { length: 128 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	relationship: mysqlEnum("relationship", ["owner", "emergency-contact", "fosterer", "groomer"]).notNull(),
});

const dogClientRelationshipRelations = relations(dogClientRelationships, ({ one }) => ({
	dog: one(dogs, {
		fields: [dogClientRelationships.dogId],
		references: [dogs.id],
	}),
	client: one(clients, {
		fields: [dogClientRelationships.clientId],
		references: [clients.id],
	}),
}));

type DogClientRelationship = InferModel<typeof dogClientRelationships>;

type DogToClientRelationship = DogClientRelationship & { client: Client };
type ClientToDogRelationship = DogClientRelationship & { dog: Dog };

export {
	dogClientRelationships,
	dogClientRelationshipRelations,
	type DogClientRelationship,
	type DogToClientRelationship,
	type ClientToDogRelationship,
};

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

const clientRelations = relations(clients, ({ many }) => ({
	dogRelationships: many(dogClientRelationships),
}));

type Client = InferModel<typeof clients>;
type ClientWithDogRelationships = Client & {
	dogRelationships: Array<
		DogClientRelationship & {
			dog: InferModel<typeof dogs>;
		}
	>;
};

export { clients, clientRelations, type Client, type ClientWithDogRelationships };

//
// ## Dog Session History
//
const dogSessionHistory = mysqlTable("dog_session_history", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	dogId: varchar("dogId", { length: 128 }).notNull(),
	userId: varchar("userId", { length: 128 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	date: timestamp("date").notNull(),
	details: text("details").notNull(),
});

const dogSessionHistoryRelations = relations(dogSessionHistory, ({ one }) => ({
	dog: one(dogs, {
		fields: [dogSessionHistory.dogId],
		references: [dogs.id],
	}),
}));

type DogSessionHistory = InferModel<typeof dogSessionHistory> & { user: UserSchema | undefined };

export { dogSessionHistory, dogSessionHistoryRelations, type DogSessionHistory };

//
// ## Dogs
//
const dogs = mysqlTable("dogs", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	givenName: varchar("givenName", { length: 50 }).notNull(),
	breed: varchar("breed", { length: 100 }).notNull(),
	age: varchar("age", { length: 10 }).notNull(),
	sex: varchar("sex", { length: 256 }).notNull(),
	desexed: boolean("desexed").notNull(),
	color: varchar("city", { length: 50 }).notNull(),
	notes: text("notes"),
});

const dogRelations = relations(dogs, ({ many }) => ({
	clientRelationships: many(dogClientRelationships),
	sessionHistory: many(dogSessionHistory),
}));

type Dog = InferModel<typeof dogs>;
type DogWithClientRelationships = Dog & {
	clientRelationships:
		| Array<
				DogClientRelationship & {
					client: Client & {
						dogRelationships: Array<
							DogClientRelationship & {
								dog: InferModel<typeof dogs>;
							}
						>;
					};
				}
		  >
		| undefined;
	sessionHistory: Array<DogSessionHistory>;
};

export { dogs, dogRelations, type Dog, type DogWithClientRelationships };
