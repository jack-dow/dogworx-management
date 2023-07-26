ALTER TABLE `dogs` RENAME COLUMN `state` TO `notes`;--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `notes` text;--> statement-breakpoint
ALTER TABLE `dogs` MODIFY COLUMN `notes` text;