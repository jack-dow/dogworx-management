ALTER TABLE `vets` RENAME COLUMN `name` TO `given_name`;--> statement-breakpoint
ALTER TABLE `vets` MODIFY COLUMN `given_name` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `vets` ADD `family_name` varchar(50) DEFAULT '' NOT NULL;