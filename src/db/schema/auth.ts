import { relations, sql } from "drizzle-orm";
import { boolean, char, customType, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

// Drizzle currently doesn't support unsigned integers out of the box, so we are using a custom type.
const unsignedSmallInt = customType<{
	data: number;
	driverData: number;
}>({
	dataType() {
		return "smallint unsigned";
	},
	fromDriver(data: number) {
		return data;
	},
});

export const organizationRoleOptions = ["owner", "admin", "member"] as const;

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------
const users = mysqlTable("auth_users", {
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
	emailAddress: varchar("email_address", { length: 100 }).notNull().unique(),
	organizationRole: mysqlEnum("organization_role", organizationRoleOptions).notNull(),
	bannedAt: timestamp("banned_at"),
	bannedUntil: timestamp("banned_until"),
	profileImageUrl: varchar("profile_image_url", { length: 255 }),
});

const usersRelations = relations(users, ({ many, one }) => ({
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id],
	}),
	sessions: many(sessions),
	organizationInviteLinks: many(organizationInviteLinks),
}));

// -----------------------------------------------------------------------------
// Sessions
// -----------------------------------------------------------------------------
const sessions = mysqlTable("auth_sessions", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	userId: char("user_id", { length: 24 }).notNull(),
	lastActiveAt: timestamp("last_active_at"),
	expiresAt: timestamp("expires_at").notNull(),
	ipAddress: varchar("ip_address", { length: 15 }),
	userAgent: varchar("user_agent", { length: 200 }),
	city: varchar("city", { length: 50 }),
	country: varchar("country", { length: 100 }),
});

const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

// -----------------------------------------------------------------------------
// Verification Codes
// -----------------------------------------------------------------------------
const verificationCodes = mysqlTable("auth_verification_codes", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	emailAddress: varchar("email_address", { length: 100 }).notNull(),
	code: char("code", { length: 6 }).notNull().unique(),
	token: char("token", { length: 64 }).unique(),
	expiresAt: timestamp("expires_at").notNull(),
});

const verificationCodesRelations = relations(verificationCodes, ({ one }) => ({
	user: one(users, {
		fields: [verificationCodes.emailAddress],
		references: [users.emailAddress],
	}),
}));

// -----------------------------------------------------------------------------
// Organizations
// -----------------------------------------------------------------------------
const organizations = mysqlTable("auth_organizations", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	maxUsers: unsignedSmallInt("max_users").notNull(),
	emailAddress: varchar("email_address", { length: 100 }).notNull().unique(),
	notifyAdminsAboutEmails: boolean("notify_admins_about_emails").notNull().default(false),
	streetAddress: varchar("street_address", { length: 100 }).notNull().default(""),
	city: varchar("city", { length: 50 }).notNull().default(""),
	state: varchar("state", { length: 30 }).notNull().default(""),
	postalCode: varchar("postal_code", { length: 10 }).notNull().default(""),
	notes: text("notes"),
});

const organizationsRelations = relations(organizations, ({ many }) => ({
	organizationInviteLinks: many(organizationInviteLinks),
	organizationUsers: many(users),
}));

// -----------------------------------------------------------------------------
// Organization Invite Links
// -----------------------------------------------------------------------------
const organizationInviteLinks = mysqlTable("auth_organization_invite_links", {
	id: char("id", { length: 24 }).notNull().primaryKey(),
	createdAt: timestamp("created_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow()
		.notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	userId: char("user_id", { length: 24 }).notNull(),
	expiresAfter: unsignedMediumInt("expires_after_in_seconds").notNull(),
	uses: unsignedSmallInt("uses").notNull().default(0),
	maxUses: unsignedSmallInt("max_uses"),
});

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
	usersRelations,
	sessions,
	sessionsRelations,
	verificationCodes,
	verificationCodesRelations,
	organizations,
	organizationsRelations,
	organizationInviteLinks,
	organizationInviteLinksRelations,
};
