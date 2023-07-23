import { relations, type InferModel } from "drizzle-orm";
import { boolean, int, mysqlEnum, mysqlTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";

const users = mysqlTable("auth_users", {
	id: varchar("id", { length: 255 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	givenName: varchar("given_name", { length: 255 }).notNull(),
	familyName: varchar("family_name", { length: 255 }).notNull().default(""),
	primaryEmailAddressId: varchar("primary_email_address_id", { length: 255 }).unique(),
	organizationId: varchar("organization_id", { length: 255 }).notNull(),
	isBanned: boolean("is_banned").notNull().default(false),
	bannedAt: timestamp("banned_at"),
	bannedUntil: timestamp("banned_until"),
	password: varchar("password", { length: 255 }),
	emailVerified: timestamp("email_verified"),
	profileImageUrl: text("profile_image_url"),
});
type User = InferModel<typeof users>;

const usersRelations = relations(users, ({ many, one }) => ({
	providerAccounts: many(providerAccounts),
	sessions: many(sessions),
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id],
	}),
	organizationInviteLinks: many(organizationInviteLinks),
}));

const providerAccounts = mysqlTable("auth_provider_accounts", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	provider: mysqlEnum("provider", ["google", "email"]).notNull(),
	providerAccountId: varchar("provider_account_id", { length: 255 }).notNull().unique(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: timestamp("expires_at"),
	tokenType: varchar("token_type", { length: 255 }),
	scope: varchar("scope", { length: 255 }),
	idToken: text("id_token"),
});
type ProviderAccount = InferModel<typeof providerAccounts>;

const providerAccountsRelations = relations(providerAccounts, ({ one }) => ({
	user: one(users, {
		fields: [providerAccounts.userId],
		references: [users.id],
	}),
}));

const sessions = mysqlTable("auth_sessions", {
	id: varchar("id", { length: 128 }).notNull().primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	// Max length I could get planetscale to accept
	sessionToken: varchar("session_token", { length: 750 }).notNull().unique(),
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

const verificationTokens = mysqlTable(
	"auth_verification_tokens",
	{
		identifier: varchar("identifier", { length: 255 }).notNull(),
		token: varchar("token", { length: 255 }).notNull().unique(),
		expiresAt: timestamp("expires_at").notNull(),
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
	providerAccounts,
	type ProviderAccount,
	providerAccountsRelations,
	sessions,
	type Session,
	sessionsRelations,
	verificationTokens,
	type VerificationToken,
	organizations,
	type Organization,
	organizationsRelations,
	organizationInviteLinks,
	type OrganizationInviteLink,
	organizationInviteLinksRelations,
};
