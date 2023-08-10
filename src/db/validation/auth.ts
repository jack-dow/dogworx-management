import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { organizationInviteLinks, organizations, sessions, users } from "../schema";
import { createActionsLogSchema, IdSchema } from "./utils";

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------
export const SelectUserSchema = createSelectSchema(users);
export type SelectUserSchema = z.infer<typeof SelectUserSchema>;

export const InsertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true }).extend({
	id: IdSchema,
});
export type InsertUserSchema = z.infer<typeof InsertUserSchema>;

export const UpdateUserSchema = InsertUserSchema.pick({
	name: true,
	givenName: true,
	familyName: true,
	emailAddress: true,
	profileImageUrl: true,
	organizationRole: true,
	bannedAt: true,
	bannedUntil: true,
});
export type UpdateUserSchema = z.infer<typeof UpdateUserSchema>;

// -----------------------------------------------------------------------------
// Sessions
// -----------------------------------------------------------------------------
export const SelectSessionSchema = createSelectSchema(sessions);
export type SelectSessionSchema = z.infer<typeof SelectSessionSchema>;

export const InsertSessionSchema = createInsertSchema(sessions)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
	});
export type InsertSessionSchema = z.infer<typeof InsertSessionSchema>;

export const UpdateSessionSchema = InsertSessionSchema.partial().extend({
	id: IdSchema,
});
export type UpdateSessionSchema = z.infer<typeof UpdateSessionSchema>;

// -----------------------------------------------------------------------------
// Organization Invite Links
// -----------------------------------------------------------------------------
export const SelectOrganizationInviteLinkSchema = createSelectSchema(organizationInviteLinks);
export type SelectOrganizationInviteLinkSchema = z.infer<typeof SelectOrganizationInviteLinkSchema>;

export const InsertOrganizationInviteLinkSchema = createInsertSchema(organizationInviteLinks).extend({
	id: IdSchema,
	organizationId: IdSchema,
	userId: IdSchema,
	uses: z.number().int().default(0),
	maxUses: z.number().int().positive().nullable(),
});
export type InsertOrganizationInviteLinkSchema = z.infer<typeof InsertOrganizationInviteLinkSchema>;

export const UpdateOrganizationInviteLinkSchema = InsertOrganizationInviteLinkSchema.partial().extend({
	id: IdSchema,
});
export type UpdateOrganizationInviteLinkSchema = z.infer<typeof UpdateOrganizationInviteLinkSchema>;

export const OrganizationInviteLinksActionsLogSchema = createActionsLogSchema(
	InsertOrganizationInviteLinkSchema,
	UpdateOrganizationInviteLinkSchema,
);

// -----------------------------------------------------------------------------
// Organizations
// -----------------------------------------------------------------------------
export const InsertOrganizationSchema = createInsertSchema(organizations)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		maxUsers: z.number().int().positive(),
		actions: z.object({
			organizationInviteLinks: OrganizationInviteLinksActionsLogSchema,
		}),
	});
export type InsertOrganizationSchema = z.infer<typeof InsertOrganizationSchema>;

export const UpdateOrganizationSchema = InsertOrganizationSchema.partial().extend({
	id: IdSchema,
});
export type UpdateOrganizationSchema = z.infer<typeof UpdateOrganizationSchema>;
