ALTER TABLE `dog_client_relationships` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `dog_client_relationships` ADD `id` varchar(128) PRIMARY KEY NOT NULL;--> statement-breakpoint