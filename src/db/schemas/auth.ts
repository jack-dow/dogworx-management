import { relations, type InferModel } from "drizzle-orm";
import { int, mysqlEnum, mysqlTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { type ProviderType } from "next-auth/providers";

const users = mysqlTable("auth_users", {
	id: varchar("id", { length: 255 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	givenName: varchar("given_name", { length: 255 }).notNull(),
	familyName: varchar("family_name", { length: 255 }).notNull().default(""),
	email: varchar("email", { length: 255 }).notNull().unique(),
	password: varchar("password", { length: 255 }),
	emailVerified: timestamp("email_verified"),
	image: text("image"),
});
type User = InferModel<typeof users>;

const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	organizationToUserRelationships: many(organizationToUserRelationships),
	organizationInviteLinks: many(organizationInviteLinks),
}));

const accounts = mysqlTable("auth_accounts", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	provider: varchar("provider", { length: 255 }).notNull(),
	providerAccountId: varchar("provider_account_id", { length: 255 }).notNull().unique(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	type: varchar("type", { length: 255 }).$type<ProviderType>().notNull(),
	refresh_token: text("refresh_token"),
	access_token: text("access_token"),
	expires_at: int("expires_at"),
	token_type: varchar("token_type", { length: 255 }),
	scope: varchar("scope", { length: 255 }),
	id_token: text("id_token"),
	session_state: varchar("session_state", { length: 255 }),
});
type Account = InferModel<typeof accounts>;

const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));

const sessions = mysqlTable("auth_sessions", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	expires: timestamp("expires", { mode: "date" }).notNull(),
});
type Session = InferModel<typeof sessions>;

const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

const verificationTokens = mysqlTable(
	"auth_verification_tokens",
	{
		identifier: varchar("identifier", { length: 255 }).notNull(),
		token: varchar("token", { length: 255 }).notNull().unique(),
		expires: timestamp("expires", { mode: "date" }).notNull(),
	},
	(vt) => ({
		pk: primaryKey(vt.identifier, vt.token),
	}),
);
type VerificationToken = InferModel<typeof verificationTokens>;

const organizations = mysqlTable("auth_organizations", {
	id: varchar("id", { length: 255 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	maxUsers: int("max_users").notNull(),
	notes: text("notes"),
});
type Organization = InferModel<typeof organizations>;

const organizationsRelations = relations(organizations, ({ many }) => ({
	organizationToUserRelationships: many(organizationToUserRelationships),
	organizationInviteLinks: many(organizationInviteLinks),
}));

const organizationToUserRelationships = mysqlTable("auth_organization_to_user_relationships", {
	id: varchar("id", { length: 255 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	organizationId: varchar("organization_id", { length: 255 }).notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	role: mysqlEnum("role", ["owner", "admin", "member"]).notNull(),
});
type OrganizationToUserRelationship = InferModel<typeof organizationToUserRelationships>;

const organizationToUserRelationshipsRelations = relations(organizationToUserRelationships, ({ one }) => ({
	organization: one(organizations, {
		fields: [organizationToUserRelationships.organizationId],
		references: [organizations.id],
	}),
	user: one(users, {
		fields: [organizationToUserRelationships.userId],
		references: [users.id],
	}),
}));

const organizationInviteLinks = mysqlTable("auth_organization_invite_links", {
	id: varchar("id", { length: 255 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	organizationId: varchar("organization_id", { length: 255 }).notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	role: mysqlEnum("role", ["owner", "admin", "member"]).notNull(),
	email: varchar("email", { length: 255 }),
	uses: int("uses").notNull().default(0),
	maxUses: int("max_uses").notNull().default(1),
});
type OrganizationInviteLink = InferModel<typeof organizationInviteLinks>;

const organizationInviteLinksRelations = relations(organizationInviteLinks, ({ one }) => ({
	organization: one(organizations, {
		fields: [organizationInviteLinks.organizationId],
		references: [organizations.id],
	}),
	user: one(users, {
		fields: [organizationInviteLinks.userId],
		references: [users.id],
	}),
}));

export {
	users,
	type User,
	usersRelations,
	accounts,
	type Account,
	accountsRelations,
	sessions,
	type Session,
	sessionsRelations,
	verificationTokens,
	type VerificationToken,
	organizations,
	type Organization,
	organizationsRelations,
	organizationToUserRelationships,
	type OrganizationToUserRelationship,
	organizationToUserRelationshipsRelations,
	organizationInviteLinks,
	type OrganizationInviteLink,
	organizationInviteLinksRelations,
};
