import { relations, type InferModel } from "drizzle-orm";
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

const organizationRoleOptions = ["owner", "admin", "member"] as const;

const users = mysqlTable("auth_users", {
	id: varchar("id", { length: 255 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	givenName: varchar("given_name", { length: 255 }).notNull(),
	familyName: varchar("family_name", { length: 255 }).notNull().default(""),
	emailAddress: varchar("email_address", { length: 255 }).notNull().unique(),
	organizationId: varchar("organization_id", { length: 255 }).notNull(),
	organizationRole: mysqlEnum("organization_role", organizationRoleOptions).notNull(),
	bannedAt: timestamp("banned_at"),
	bannedUntil: timestamp("banned_until"),
	profileImageUrl: text("profile_image_url"),
});
type User = InferModel<typeof users>;

const usersRelations = relations(users, ({ many, one }) => ({
	sessions: many(sessions),
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id],
	}),
	organizationInviteLinks: many(organizationInviteLinks),
}));

const sessions = mysqlTable("auth_sessions", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	sessionToken: text("session_token").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	ipAddress: varchar("ip_address", { length: 255 }),
	userAgent: varchar("user_agent", { length: 255 }),
	city: varchar("city", { length: 255 }),
	country: varchar("country", { length: 255 }),
});
type Session = InferModel<typeof sessions>;

const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

const verificationCodes = mysqlTable("auth_verification_codes", {
	id: varchar("id", { length: 255 }).notNull().primaryKey(),
	emailAddress: varchar("email_address", { length: 255 }).notNull(),
	code: varchar("code", { length: 25 }).notNull().unique(),
	token: varchar("token", { length: 255 }).unique(),
	expiresAt: timestamp("expires_at").notNull(),
});
type VerificationCode = InferModel<typeof verificationCodes>;

const verificationCodesRelations = relations(verificationCodes, ({ one }) => ({
	user: one(users, {
		fields: [verificationCodes.emailAddress],
		references: [users.emailAddress],
	}),
}));

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
	organizationInviteLinks: many(organizationInviteLinks),
	users: many(users),
}));

const organizationInviteLinks = mysqlTable("auth_organization_invite_links", {
	id: varchar("id", { length: 255 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	organizationId: varchar("organization_id", { length: 255 }).notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	role: mysqlEnum("role", organizationRoleOptions).notNull(),
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
	sessions,
	type Session,
	sessionsRelations,
	verificationCodes,
	type VerificationCode,
	verificationCodesRelations,
	organizations,
	type Organization,
	organizationsRelations,
	organizationInviteLinks,
	type OrganizationInviteLink,
	organizationInviteLinksRelations,
};
