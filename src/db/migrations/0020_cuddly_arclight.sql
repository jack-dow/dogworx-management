ALTER TABLE `clients` MODIFY COLUMN `phone_number` varchar(20) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `email_address` varchar(256) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `street_address` varchar(256) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `city` varchar(50) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `state` varchar(50) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `postal_code` varchar(10) NOT NULL DEFAULT '';