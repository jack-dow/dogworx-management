CREATE TABLE `auth_organization_invite_links` (
	`id` varchar(255) PRIMARY KEY NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expires_at` timestamp NOT NULL,
	`organization_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`role` enum('owner','admin','member') NOT NULL,
	`email` varchar(255),
	`uses` int NOT NULL DEFAULT 0,
	`max_uses` int NOT NULL DEFAULT 1
);
--> statement-breakpoint
ALTER TABLE `auth_organizations` ADD `notes` text;