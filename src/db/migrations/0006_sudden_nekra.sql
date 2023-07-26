CREATE TABLE `dog_client_relationships` (
	`dogId` varchar(128) NOT NULL,
	`clientId` varchar(128) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`relationship` enum('owner','emergency-contact','fosterer','groomer') NOT NULL,
	PRIMARY KEY(`clientId`,`dogId`)
);
--> statement-breakpoint
DROP TABLE `dog-client-relationships`;