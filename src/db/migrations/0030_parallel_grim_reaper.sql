RENAME TABLE `auth_accounts` TO `auth_provider_accounts`;--> statement-breakpoint
ALTER TABLE `auth_provider_accounts` DROP CONSTRAINT `auth_accounts_provider_account_id_unique`;--> statement-breakpoint
ALTER TABLE `auth_provider_accounts` MODIFY COLUMN `provider` enum('google','email') NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_provider_accounts` ADD CONSTRAINT `auth_provider_accounts_provider_account_id_unique` UNIQUE(`provider_account_id`);