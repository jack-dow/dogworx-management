CREATE TABLE `auth_user_email_addresses` (
	`id` varchar(255) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`user_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	`is_verified` boolean NOT NULL DEFAULT false,
	`verified_at` timestamp,
	CONSTRAINT `auth_user_email_addresses_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
RENAME TABLE `auth_provider_accounts` TO `auth_user_connected_accounts`;--> statement-breakpoint
ALTER TABLE `auth_user_connected_accounts` DROP CONSTRAINT `auth_provider_accounts_provider_account_id_unique`;--> statement-breakpoint
ALTER TABLE `auth_users` DROP COLUMN `password`;--> statement-breakpoint
ALTER TABLE `auth_users` DROP COLUMN `email_verified`;--> statement-breakpoint
ALTER TABLE `auth_user_connected_accounts` ADD CONSTRAINT `auth_user_connected_accounts_provider_account_id_unique` UNIQUE(`provider_account_id`);