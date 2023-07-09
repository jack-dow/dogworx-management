CREATE TABLE `dog_to_vet_relationships` (
	`id` varchar(128) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`dogId` varchar(128) NOT NULL,
	`vetId` varchar(128) NOT NULL,
	`relationship` enum('primary','secondary') NOT NULL);
--> statement-breakpoint
CREATE TABLE `vet_clinics` (
	`id` varchar(128) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`name` varchar(100) NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`email_address` varchar(256) NOT NULL,
	`notes` text);
--> statement-breakpoint
CREATE TABLE `vet_to_vet_clinic_relationships` (
	`id` varchar(128) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`vetId` varchar(128) NOT NULL,
	`vetClinicId` varchar(128) NOT NULL,
	`relationship` enum('full-time','part-time') NOT NULL);
--> statement-breakpoint
CREATE TABLE `vets` (
	`id` varchar(128) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`name` varchar(100) NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`email_address` varchar(256) NOT NULL,
	`notes` text);
--> statement-breakpoint
RENAME TABLE `dog_session_history` TO `dog_sessions`;--> statement-breakpoint
RENAME TABLE `dog_client_relationships` TO `dog_to_client_relationships`;