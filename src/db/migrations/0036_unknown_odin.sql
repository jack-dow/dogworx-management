CREATE TABLE `auth_magic_links` (
	`id` varchar(255) PRIMARY KEY NOT NULL,
	`user_email_address_id` varchar(255) NOT NULL,
	`code` varchar(25) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `auth_magic_links_code_unique` UNIQUE(`code`),
	CONSTRAINT `auth_magic_links_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
DROP TABLE `auth_user_connected_accounts`;--> statement-breakpoint
DROP TABLE `auth_user_email_addresses`;--> statement-breakpoint
DROP TABLE `auth_verification_tokens`;--> statement-breakpoint
ALTER TABLE `auth_users` RENAME COLUMN `primary_email_address_id` TO `email_address`;--> statement-breakpoint
ALTER TABLE `auth_users` DROP CONSTRAINT `auth_users_primary_email_address_id_unique`;--> statement-breakpoint
ALTER TABLE `auth_users` DROP COLUMN `is_banned`;--> statement-breakpoint
ALTER TABLE `auth_users` ADD CONSTRAINT `auth_users_email_address_unique` UNIQUE(`email_address`);