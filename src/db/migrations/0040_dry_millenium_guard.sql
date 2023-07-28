ALTER TABLE `dog_sessions` RENAME COLUMN `dogId` TO `dog_id`;--> statement-breakpoint
ALTER TABLE `dog_sessions` RENAME COLUMN `userId` TO `user_id`;--> statement-breakpoint
ALTER TABLE `dog_to_client_relationships` RENAME COLUMN `dogId` TO `dog_id`;--> statement-breakpoint
ALTER TABLE `dog_to_client_relationships` RENAME COLUMN `clientId` TO `client_id`;--> statement-breakpoint
ALTER TABLE `dog_to_vet_relationships` RENAME COLUMN `dogId` TO `dog_id`;--> statement-breakpoint
ALTER TABLE `dog_to_vet_relationships` RENAME COLUMN `vetId` TO `vet_id`;--> statement-breakpoint
ALTER TABLE `dogs` RENAME COLUMN `givenName` TO `given_name`;--> statement-breakpoint
ALTER TABLE `dogs` RENAME COLUMN `city` TO `color`;--> statement-breakpoint
ALTER TABLE `vet_to_vet_clinic_relationships` RENAME COLUMN `vetId` TO `vet_id`;--> statement-breakpoint
ALTER TABLE `vet_to_vet_clinic_relationships` RENAME COLUMN `vetClinicId` TO `vet_clinic_id`;--> statement-breakpoint
ALTER TABLE `dog_sessions` MODIFY COLUMN `user_id` varchar(128);