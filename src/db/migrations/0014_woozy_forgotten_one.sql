CREATE TABLE `dog_session_history` (
	`id` varchar(128) PRIMARY KEY NOT NULL,
	`dogId` varchar(128) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`date` timestamp NOT NULL,
	`details` text NOT NULL);
