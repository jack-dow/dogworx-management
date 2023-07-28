CREATE TABLE `auth_accounts` (
	`id` varchar(128) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`provider` varchar(255) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`refresh_token` varchar(255),
	`access_token` varchar(255),
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` varchar(255),
	`session_state` varchar(255)
);
--> statement-breakpoint
CREATE TABLE `auth_organization_to_user_relationships` (
	`id` varchar(255) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`organization_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`role` enum('owner','admin','member') NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_organizations` (
	`id` varchar(255) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`name` varchar(255) NOT NULL,
	`max_users` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` varchar(128) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`session_token` varchar(255) PRIMARY KEY NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_users` (
	`id` varchar(255) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`name` varchar(255) NOT NULL,
	`given_name` varchar(255) NOT NULL,
	`family_name` varchar(255) NOT NULL DEFAULT '',
	`email` varchar(255) NOT NULL,
	`password` varchar(255),
	`email_verified` timestamp,
	`image` text
);
--> statement-breakpoint
CREATE TABLE `auth_verification_tokens` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `auth_verification_tokens_identifier_token` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `given_name` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `family_name` varchar(64) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `email_address` varchar(255) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `phone_number` varchar(28) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `street_address` varchar(255) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `city` varchar(64) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `state` varchar(64) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `dogs` MODIFY COLUMN `givenName` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `dogs` MODIFY COLUMN `breed` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `dogs` MODIFY COLUMN `city` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `vet_clinics` MODIFY COLUMN `name` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `vet_clinics` MODIFY COLUMN `email_address` varchar(255) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `given_name` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `family_name` varchar(64) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `email_address` varchar(255) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `phone_number` varchar(28) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` ADD `organization_id` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_sessions` ADD `organization_id` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_to_client_relationships` ADD `organization_id` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_to_vet_relationships` ADD `organization_id` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `dogs` ADD `organization_id` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `vet_clinics` ADD `organization_id` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `vet_to_vet_clinic_relationships` ADD `organization_id` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `vets` ADD `organization_id` varchar(128) NOT NULL;