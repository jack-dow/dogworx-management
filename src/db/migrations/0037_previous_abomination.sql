CREATE TABLE `auth_verification_codes` (
	`id` varchar(255) PRIMARY KEY NOT NULL,
	`email_address` varchar(255) NOT NULL,
	`code` varchar(25) NOT NULL,
	`token` varchar(255),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `auth_verification_codes_code_unique` UNIQUE(`code`),
	CONSTRAINT `auth_verification_codes_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
DROP TABLE `auth_magic_links`;--> statement-breakpoint
ALTER TABLE `auth_users` MODIFY COLUMN `email_address` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_users` ADD `organization_role` enum('owner','admin','member') NOT NULL;