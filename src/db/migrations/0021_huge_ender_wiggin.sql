ALTER TABLE `vet_clinics` MODIFY COLUMN `phone_number` varchar(20) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `vet_clinics` MODIFY COLUMN `email_address` varchar(256) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `phone_number` varchar(20) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `email_address` varchar(256) NOT NULL DEFAULT '';