ALTER TABLE `dogs` MODIFY COLUMN `age` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `dogs` ADD `is_age_exact` boolean NOT NULL;