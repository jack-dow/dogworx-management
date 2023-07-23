CREATE TABLE `dog-client-relationships` (
	`dogId` varchar(128) NOT NULL,
	`clientId` varchar(128) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`relationship` enum('owner','emergency-contact','fosterer','groomer') NOT NULL,
	PRIMARY KEY(`clientId`,`dogId`)
);
--> statement-breakpoint
CREATE TABLE `dogs` (
	`id` varchar(128) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`name` varchar(50) NOT NULL,
	`breed` varchar(100) NOT NULL,
	`age` varchar(10) NOT NULL,
	`sex` varchar(256) NOT NULL,
	`desexed` boolean NOT NULL,
	`city` varchar(50) NOT NULL,
	`state` varchar(256));
--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `last_name` varchar(50) NOT NULL DEFAULT '';