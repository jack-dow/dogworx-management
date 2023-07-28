ALTER TABLE `auth_sessions` RENAME COLUMN `access_token` TO `session_token`;--> statement-breakpoint
ALTER TABLE `auth_sessions` DROP CONSTRAINT `auth_sessions_refresh_token_unique`;--> statement-breakpoint
ALTER TABLE `auth_sessions` DROP CONSTRAINT `auth_sessions_access_token_unique`;--> statement-breakpoint
ALTER TABLE `auth_sessions` MODIFY COLUMN `session_token` varchar(750) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_sessions` DROP COLUMN `refresh_token`;--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_session_token_unique` UNIQUE(`session_token`);