import { relations, sql } from "drizzle-orm";
import { boolean, char, customType, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const unsignedSmallInt = customType<{
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
	givenName: varchar("given_name", { length: 50 }).notNull(),
	familyName: varchar("family_name", { length: 50 }).notNull().default(""),
	emailAddress: varchar("email_address", { length: 100 }).notNull().unique(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	organizationRole: mysqlEnum("organization_role", organizationRoleOptions).notNull(),
	bannedAt: timestamp("banned_at"),
	bannedUntil: timestamp("banned_until"),
	profileImageUrl: varchar("profile_image_url", { length: 255 }),
});

const usersRelations = relations(users, ({ many, one }) => ({
	sessions: many(sessions),
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id],
	}),
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
	expiresAt: timestamp("expires_at").notNull(),
	ipAddress: varchar("ip_address", { length: 15 }),
	userAgent: varchar("user_agent", { length: 200 }),
	city: varchar("city", { length: 50 }),
	country: varchar("country", { length: 100 }),
	lastActiveAt: timestamp("last_active_at")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
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
	notes: text("notes"),
});

const organizationsRelations = relations(organizations, ({ many }) => ({
	organizationInviteLinks: many(organizationInviteLinks),
	users: many(users),
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
	expiresAt: timestamp("expires_at").notNull(),
	organizationId: char("organization_id", { length: 24 }).notNull(),
	userId: char("user_id", { length: 24 }),
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
