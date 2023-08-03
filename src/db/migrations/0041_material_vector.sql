ALTER TABLE `clients` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `given_name` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `family_name` varchar(50) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `email_address` varchar(100) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `phone_number` varchar(20) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `street_address` varchar(100) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `city` varchar(50) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `state` varchar(30) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `organization_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_sessions` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_sessions` MODIFY COLUMN `dog_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_sessions` MODIFY COLUMN `user_id` char(24);--> statement-breakpoint
ALTER TABLE `dog_sessions` MODIFY COLUMN `organization_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_to_client_relationships` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_to_client_relationships` MODIFY COLUMN `dog_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_to_client_relationships` MODIFY COLUMN `client_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_to_client_relationships` MODIFY COLUMN `organization_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_to_vet_relationships` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_to_vet_relationships` MODIFY COLUMN `dog_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_to_vet_relationships` MODIFY COLUMN `vet_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dog_to_vet_relationships` MODIFY COLUMN `organization_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dogs` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `dogs` MODIFY COLUMN `given_name` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `dogs` MODIFY COLUMN `breed` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `dogs` MODIFY COLUMN `age` date NOT NULL;--> statement-breakpoint
ALTER TABLE `dogs` MODIFY COLUMN `color` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `dogs` MODIFY COLUMN `organization_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `vet_clinics` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `vet_clinics` MODIFY COLUMN `name` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `vet_clinics` MODIFY COLUMN `email_address` varchar(100) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `vet_clinics` MODIFY COLUMN `organization_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `vet_to_vet_clinic_relationships` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `vet_to_vet_clinic_relationships` MODIFY COLUMN `vet_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `vet_to_vet_clinic_relationships` MODIFY COLUMN `vet_clinic_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `vet_to_vet_clinic_relationships` MODIFY COLUMN `organization_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `given_name` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `family_name` varchar(50) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `email_address` varchar(100) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `phone_number` varchar(20) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `organization_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_organization_invite_links` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_organization_invite_links` MODIFY COLUMN `organization_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_organization_invite_links` MODIFY COLUMN `user_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_organization_invite_links` MODIFY COLUMN `uses` smallint UNSIGNED NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_organization_invite_links` MODIFY COLUMN `max_uses` smallint UNSIGNED;--> statement-breakpoint
ALTER TABLE `auth_organizations` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_organizations` MODIFY COLUMN `name` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_organizations` MODIFY COLUMN `max_users` smallint UNSIGNED NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_sessions` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_sessions` MODIFY COLUMN `session_token` varchar(900) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_sessions` MODIFY COLUMN `user_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_sessions` MODIFY COLUMN `ip_address` varchar(15);--> statement-breakpoint
ALTER TABLE `auth_sessions` MODIFY COLUMN `user_agent` varchar(200);--> statement-breakpoint
ALTER TABLE `auth_sessions` MODIFY COLUMN `city` varchar(50);--> statement-breakpoint
ALTER TABLE `auth_sessions` MODIFY COLUMN `country` varchar(100);--> statement-breakpoint
ALTER TABLE `auth_users` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_users` MODIFY COLUMN `given_name` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_users` MODIFY COLUMN `family_name` varchar(50) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `auth_users` MODIFY COLUMN `email_address` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_users` MODIFY COLUMN `organization_id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_users` MODIFY COLUMN `profile_image_url` varchar(255);--> statement-breakpoint
ALTER TABLE `auth_verification_codes` MODIFY COLUMN `id` char(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_verification_codes` MODIFY COLUMN `email_address` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_verification_codes` MODIFY COLUMN `code` char(6) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_verification_codes` MODIFY COLUMN `token` char(64);--> statement-breakpoint
ALTER TABLE `dogs` ADD `is_age_estimate` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `dogs` DROP COLUMN `is_age_exact`;--> statement-breakpoint
ALTER TABLE `auth_users` DROP COLUMN `name`;