CREATE TABLE `clients` (
	`id` varchar(128) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`given_name` varchar(50) NOT NULL,
	`family_name` varchar(50) NOT NULL DEFAULT '',
	`phone_number` varchar(20) NOT NULL,
	`email_address` varchar(256) NOT NULL,
	`street_address` varchar(256) NOT NULL,
	`city` varchar(50) NOT NULL,
	`state` varchar(50) NOT NULL,
	`postal_code` varchar(10) NOT NULL);
