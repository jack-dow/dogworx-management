ALTER TABLE `auth_sessions` MODIFY COLUMN `session_token` text NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_organization_invite_links` DROP COLUMN `email`;