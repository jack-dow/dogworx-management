ALTER TABLE `auth_sessions` MODIFY COLUMN `refresh_token` varchar(2048) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_sessions` MODIFY COLUMN `access_token` varchar(2048) NOT NULL;