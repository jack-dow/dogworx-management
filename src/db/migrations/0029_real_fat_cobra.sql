ALTER TABLE `auth_sessions` RENAME COLUMN `expires` TO `expires_at`;--> statement-breakpoint
ALTER TABLE `auth_users` RENAME COLUMN `email` TO `primary_email_address_id`;--> statement-breakpoint
ALTER TABLE `auth_users` RENAME COLUMN `image` TO `profile_image_url`;--> statement-breakpoint
ALTER TABLE `auth_verification_tokens` RENAME COLUMN `expires` TO `expires_at`;--> statement-breakpoint
ALTER TABLE `auth_accounts` MODIFY COLUMN `expires_at` timestamp;--> statement-breakpoint
ALTER TABLE `auth_users` MODIFY COLUMN `primary_email_address_id` varchar(255);--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `ip_address` varchar(255);--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `user_agent` varchar(255);--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `city` varchar(255);--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `country` varchar(255);--> statement-breakpoint
ALTER TABLE `auth_users` ADD `is_banned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_users` ADD `banned_at` timestamp;--> statement-breakpoint
ALTER TABLE `auth_users` ADD `banned_until` timestamp;--> statement-breakpoint
ALTER TABLE `auth_accounts` DROP COLUMN `type`;--> statement-breakpoint
ALTER TABLE `auth_accounts` DROP COLUMN `session_state`;--> statement-breakpoint
ALTER TABLE `auth_users` ADD CONSTRAINT `auth_users_primary_email_address_id_unique` UNIQUE(`primary_email_address_id`);