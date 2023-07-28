import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { organizationInviteLinks, organizations, sessions, users } from "../schemas";
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
export const InsertOrganizationInviteLinkSchema = createInsertSchema(organizationInviteLinks)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		organizationId: IdSchema,
		userId: IdSchema,
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
		actions: z.object({
			organizationInviteLinks: OrganizationInviteLinksActionsLogSchema,
		}),
	});
export type InsertOrganizationSchema = z.infer<typeof InsertOrganizationSchema>;

export const UpdateOrganizationSchema = InsertOrganizationSchema.partial().extend({
	id: IdSchema,
});
export type UpdateOrganizationSchema = z.infer<typeof UpdateOrganizationSchema>;
