DROP TABLE `auth_organization_to_user_relationships`;--> statement-breakpoint
ALTER TABLE `auth_users` ADD `organization_id` varchar(255) NOT NULL;