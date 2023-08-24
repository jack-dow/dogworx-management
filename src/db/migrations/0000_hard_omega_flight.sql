CREATE TABLE `clients` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`given_name` varchar(50) NOT NULL,
	`family_name` varchar(50) NOT NULL DEFAULT '',
	`email_address` varchar(100) NOT NULL DEFAULT '',
	`phone_number` varchar(20) NOT NULL DEFAULT '',
	`street_address` varchar(100) NOT NULL DEFAULT '',
	`city` varchar(50) NOT NULL DEFAULT '',
	`state` varchar(30) NOT NULL DEFAULT '',
	`postal_code` varchar(10) NOT NULL DEFAULT '',
	`organization_id` char(24) NOT NULL,
	`notes` text,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dog_sessions` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`dog_id` char(24) NOT NULL,
	`user_id` char(24),
	`date` timestamp NOT NULL,
	`details` text NOT NULL,
	`organization_id` char(24) NOT NULL,
	CONSTRAINT `dog_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dog_to_client_relationships` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`dog_id` char(24) NOT NULL,
	`client_id` char(24) NOT NULL,
	`relationship` enum('owner','emergency-contact','fosterer','groomer') NOT NULL,
	`organization_id` char(24) NOT NULL,
	CONSTRAINT `dog_to_client_relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dog_to_vet_relationships` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`dog_id` char(24) NOT NULL,
	`vet_id` char(24) NOT NULL,
	`relationship` enum('primary','secondary') NOT NULL,
	`organization_id` char(24) NOT NULL,
	CONSTRAINT `dog_to_vet_relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dogs` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`given_name` varchar(50) NOT NULL,
	`family_name` varchar(100),
	`breed` varchar(50) NOT NULL,
	`age` date NOT NULL,
	`is_age_estimate` boolean NOT NULL,
	`sex` enum('male','female','unknown') NOT NULL,
	`desexed` boolean NOT NULL,
	`color` varchar(50) NOT NULL,
	`organization_id` char(24) NOT NULL,
	`notes` text,
	CONSTRAINT `dogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vet_clinics` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`name` varchar(100) NOT NULL,
	`email_address` varchar(100) NOT NULL DEFAULT '',
	`phone_number` varchar(20) NOT NULL DEFAULT '',
	`organization_id` char(24) NOT NULL,
	`notes` text,
	CONSTRAINT `vet_clinics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vet_to_vet_clinic_relationships` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`vet_id` char(24) NOT NULL,
	`vet_clinic_id` char(24) NOT NULL,
	`relationship` enum('full-time','part-time') NOT NULL,
	`organization_id` char(24) NOT NULL,
	CONSTRAINT `vet_to_vet_clinic_relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vets` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`given_name` varchar(50) NOT NULL,
	`family_name` varchar(50) NOT NULL DEFAULT '',
	`email_address` varchar(100) NOT NULL DEFAULT '',
	`phone_number` varchar(20) NOT NULL DEFAULT '',
	`organization_id` char(24) NOT NULL,
	`notes` text,
	CONSTRAINT `vets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_organization_invite_links` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expires_at` timestamp NOT NULL,
	`organization_id` char(24) NOT NULL,
	`user_id` char(24) NOT NULL,
	`role` enum('owner','admin','member') NOT NULL,
	`uses` smallint unsigned NOT NULL DEFAULT 0,
	`max_uses` smallint unsigned,
	CONSTRAINT `auth_organization_invite_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_organizations` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`name` varchar(100) NOT NULL,
	`max_users` smallint unsigned NOT NULL,
	`notes` text,
	CONSTRAINT `auth_organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`user_id` char(24) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`ip_address` varchar(15),
	`user_agent` varchar(200),
	`city` varchar(50),
	`country` varchar(100),
	CONSTRAINT `auth_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_users` (
	`id` char(24) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`given_name` varchar(50) NOT NULL,
	`family_name` varchar(50) NOT NULL DEFAULT '',
	`email_address` varchar(100) NOT NULL,
	`organization_id` char(24) NOT NULL,
	`organization_role` enum('owner','admin','member') NOT NULL,
	`banned_at` timestamp,
	`banned_until` timestamp,
	`profile_image_url` varchar(255),
	CONSTRAINT `auth_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_users_email_address_unique` UNIQUE(`email_address`)
);
--> statement-breakpoint
CREATE TABLE `auth_verification_codes` (
	`id` char(24) NOT NULL,
	`email_address` varchar(100) NOT NULL,
	`code` char(6) NOT NULL,
	`token` char(64),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `auth_verification_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_verification_codes_code_unique` UNIQUE(`code`),
	CONSTRAINT `auth_verification_codes_token_unique` UNIQUE(`token`)
);
