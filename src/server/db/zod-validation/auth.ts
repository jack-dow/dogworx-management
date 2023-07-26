import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { organizationInviteLinks, organizations, sessions, users } from "../schemas";
import { createActionsLogSchema, IdSchema } from "./utils";

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------
const InsertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true }).extend({
	id: IdSchema,
});
type InsertUserSchema = z.infer<typeof InsertUserSchema>;

const UpdateUserSchema = InsertUserSchema.partial().extend({
	id: IdSchema,
});
type UpdateUserSchema = z.infer<typeof UpdateUserSchema>;

// -----------------------------------------------------------------------------
// Sessions
// -----------------------------------------------------------------------------
const InsertSessionSchema = createInsertSchema(sessions)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
	});
type InsertSessionSchema = z.infer<typeof InsertSessionSchema>;

const UpdateSessionSchema = InsertSessionSchema.partial().extend({
	id: IdSchema,
});
type UpdateSessionSchema = z.infer<typeof UpdateSessionSchema>;

// -----------------------------------------------------------------------------
// Organization Invite Links
// -----------------------------------------------------------------------------
const InsertOrganizationInviteLinkSchema = createInsertSchema(organizationInviteLinks)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		organizationId: IdSchema,
		userId: IdSchema,
	});
type InsertOrganizationInviteLinkSchema = z.infer<typeof InsertOrganizationInviteLinkSchema>;

const UpdateOrganizationInviteLinkSchema = InsertOrganizationInviteLinkSchema.partial().extend({
	id: IdSchema,
});
type UpdateOrganizationInviteLinkSchema = z.infer<typeof UpdateOrganizationInviteLinkSchema>;

const OrganizationInviteLinksActionsLogSchema = createActionsLogSchema(
	InsertOrganizationInviteLinkSchema,
	UpdateOrganizationInviteLinkSchema,
);

// -----------------------------------------------------------------------------
// Organizations
// -----------------------------------------------------------------------------
const InsertOrganizationSchema = createInsertSchema(organizations)
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
type InsertOrganizationSchema = z.infer<typeof InsertOrganizationSchema>;

const UpdateOrganizationSchema = InsertOrganizationSchema.partial().extend({
	id: IdSchema,
});
type UpdateOrganizationSchema = z.infer<typeof UpdateOrganizationSchema>;

export {
	InsertUserSchema,
	UpdateUserSchema,
	InsertSessionSchema,
	UpdateSessionSchema,
	InsertOrganizationInviteLinkSchema,
	UpdateOrganizationInviteLinkSchema,
	OrganizationInviteLinksActionsLogSchema,
	InsertOrganizationSchema,
	UpdateOrganizationSchema,
};
