ALTER TABLE `auth_sessions` RENAME COLUMN `session_token` TO `refresh_token`;--> statement-breakpoint
ALTER TABLE `auth_sessions` DROP CONSTRAINT `auth_sessions_session_token_unique`;--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `access_token` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_refresh_token_unique` UNIQUE(`refresh_token`);--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_access_token_unique` UNIQUE(`access_token`);