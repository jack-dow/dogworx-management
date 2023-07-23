ALTER TABLE `auth_accounts` MODIFY COLUMN `refresh_token` text NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_accounts` MODIFY COLUMN `access_token` text NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_accounts` MODIFY COLUMN `id_token` text NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_sessions` DROP PRIMARY KEY--> statement-breakpoint
ALTER TABLE `auth_sessions` MODIFY COLUMN `session_token` text NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_verification_tokens` MODIFY COLUMN `token` text NOT NULL;