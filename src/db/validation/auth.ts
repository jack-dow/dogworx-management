import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { organizationInviteLinks, organizations, sessions, users, verificationCodes } from "../schema/auth";
import { IdSchema } from "./app";

// -----------------------------------------------------------------------------
// NOTE: For the update schemas we manually select the fields that can be updated.
// This is because if a new field is added to the schema, we want to be forced to make a conscious decision about whether or not it should be updatable
// to prevent any accidental updates to fields that shouldn't be updatable.
// -----------------------------------------------------------------------------

// Drizzle currently doesn't support unsigned integers out of the box, so we are using a custom type, therefore we also have to manually represent the type in zod
const UnsignedMediumInt = z.number().int().nonnegative().max(16777215);

// Drizzle currently doesn't support unsigned integers out of the box, so we are using a custom type, therefore we also have to manually represent the type in zod
const UnsignedSmallInt = z.number().int().nonnegative().max(65535);

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------
export const InsertUserSchema = createInsertSchema(users)
	.extend({
		id: IdSchema,
	})
	.omit({ createdAt: true, updatedAt: true });
export type InsertUserSchema = z.infer<typeof InsertUserSchema>;

export const UpdateUserSchema = InsertUserSchema.pick({
	organizationId: true,
	givenName: true,
	familyName: true,
	emailAddress: true,
	organizationRole: true,
	bannedAt: true,
	bannedUntil: true,
	profileImageUrl: true,
	timezone: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateUserSchema = z.infer<typeof UpdateUserSchema>;

// -----------------------------------------------------------------------------
// Sessions
// -----------------------------------------------------------------------------
export const InsertSessionSchema = createInsertSchema(sessions)
	.extend({
		id: IdSchema,
		userId: IdSchema,
	})
	.omit({
		createdAt: true,
		updatedAt: true,
	});
export type InsertSessionSchema = z.infer<typeof InsertSessionSchema>;

export const UpdateSessionSchema = InsertSessionSchema.pick({
	lastActiveAt: true,
	expiresAt: true,
	ipAddress: true,
	userAgent: true,
	city: true,
	country: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateSessionSchema = z.infer<typeof UpdateSessionSchema>;

// -----------------------------------------------------------------------------
// Verification Codes
// -----------------------------------------------------------------------------
export const InsertVerificationCodeSchema = createInsertSchema(verificationCodes)
	.extend({
		id: IdSchema,
		code: z.string().length(6),
		token: z.string().length(64).optional(),
	})
	.omit({
		createdAt: true,
		updatedAt: true,
	});
export type InsertVerificationCodeSchema = z.infer<typeof InsertVerificationCodeSchema>;

// -----------------------------------------------------------------------------
// Organization Invite Links
// -----------------------------------------------------------------------------
export const InsertOrganizationInviteLinkSchema = createInsertSchema(organizationInviteLinks)
	.extend({
		id: z.string().cuid2().length(8),
		organizationId: IdSchema.optional(),
		userId: IdSchema,
		uses: UnsignedSmallInt,
		maxUses: UnsignedSmallInt.nullable(),
		expiresAfter: UnsignedMediumInt,
	})
	.omit({
		createdAt: true,
		updatedAt: true,
	});
export type InsertOrganizationInviteLinkSchema = z.infer<typeof InsertOrganizationInviteLinkSchema>;

export const UpdateOrganizationInviteLinkSchema = InsertOrganizationInviteLinkSchema.pick({
	organizationId: true,
	userId: true,
	expiresAfter: true,
	maxUses: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateOrganizationInviteLinkSchema = z.infer<typeof UpdateOrganizationInviteLinkSchema>;

// -----------------------------------------------------------------------------
// Organizations
// -----------------------------------------------------------------------------
export const InsertOrganizationSchema = createInsertSchema(organizations)
	.extend({
		id: IdSchema,
		maxUsers: UnsignedSmallInt,
		organizationInviteLinks: z.array(
			InsertOrganizationInviteLinkSchema.extend({
				createdAt: z.date(),
				user: createSelectSchema(users).pick({
					id: true,
					givenName: true,
					familyName: true,
					emailAddress: true,
				}),
			}),
		),
		organizationUsers: z.array(
			InsertUserSchema.extend({
				sessions: z
					.array(
						createSelectSchema(sessions).pick({
							id: true,
							userId: true,
							lastActiveAt: true,
							expiresAt: true,
							ipAddress: true,
							userAgent: true,
							city: true,
							country: true,
						}),
					)
					.optional(),
			}),
		),
	})
	.omit({
		createdAt: true,
		updatedAt: true,
	});
export type InsertOrganizationSchema = z.infer<typeof InsertOrganizationSchema>;

export const UpdateOrganizationSchema = InsertOrganizationSchema.pick({
	name: true,
	maxUsers: true,
	emailAddress: true,
	notifyAdminsAboutEmails: true,
	notes: true,
})
	.partial()
	.extend({
		id: IdSchema,
	});
export type UpdateOrganizationSchema = z.infer<typeof UpdateOrganizationSchema>;
