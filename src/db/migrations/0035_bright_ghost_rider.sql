ALTER TABLE `auth_user_email_addresses` DROP CONSTRAINT `auth_user_email_addresses_email_unique`;--> statement-breakpoint
ALTER TABLE `auth_user_email_addresses` ADD `email_address` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_user_email_addresses` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `auth_user_email_addresses` ADD CONSTRAINT `auth_user_email_addresses_email_address_unique` UNIQUE(`email_address`);