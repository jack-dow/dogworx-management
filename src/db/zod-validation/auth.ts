import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { organizationInviteLinks, organizations, users } from "../schemas";
import { createActionsLogSchema, IdSchema } from "./utils";

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------
const SelectUserSchema = createSelectSchema(users);
type SelectUserSchema = z.infer<typeof SelectUserSchema>;

const InsertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true }).extend({
	id: IdSchema,
});
type InsertUserSchema = z.infer<typeof InsertUserSchema>;

const UpdateUserSchema = InsertUserSchema.partial().extend({
	id: IdSchema,
});
type UpdateUserSchema = z.infer<typeof UpdateUserSchema>;

// -----------------------------------------------------------------------------
// Organization Invite Links
// -----------------------------------------------------------------------------
const SelectOrganizationInviteLinks = createSelectSchema(organizationInviteLinks);
type SelectOrganizationInviteLinks = z.infer<typeof SelectOrganizationInviteLinks>;

const InsertOrganizationInviteLinks = createInsertSchema(organizationInviteLinks)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: IdSchema,
		organizationId: IdSchema,
		userId: IdSchema,
	});
type InsertOrganizationInviteLinks = z.infer<typeof InsertOrganizationInviteLinks>;

const UpdateOrganizationInviteLinks = InsertOrganizationInviteLinks.partial().extend({
	id: IdSchema,
});
type UpdateOrganizationInviteLinks = z.infer<typeof UpdateOrganizationInviteLinks>;

const OrganizationInviteLinksActionsLogSchema = createActionsLogSchema(
	InsertOrganizationInviteLinks,
	UpdateOrganizationInviteLinks,
);

// -----------------------------------------------------------------------------
// Organizations
// -----------------------------------------------------------------------------
const SelectOrganizationSchema = createSelectSchema(organizations);
type SelectOrganizationSchema = z.infer<typeof SelectOrganizationSchema>;

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
	SelectUserSchema,
	InsertUserSchema,
	UpdateUserSchema,
	SelectOrganizationInviteLinks,
	InsertOrganizationInviteLinks,
	UpdateOrganizationInviteLinks,
	OrganizationInviteLinksActionsLogSchema,
	SelectOrganizationSchema,
	InsertOrganizationSchema,
	UpdateOrganizationSchema,
};
