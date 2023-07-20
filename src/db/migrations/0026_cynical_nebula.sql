ALTER TABLE `auth_accounts` MODIFY COLUMN `refresh_token` text;--> statement-breakpoint
ALTER TABLE `auth_accounts` MODIFY COLUMN `access_token` text;--> statement-breakpoint
ALTER TABLE `auth_accounts` MODIFY COLUMN `id_token` text;