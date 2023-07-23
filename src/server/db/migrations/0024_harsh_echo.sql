ALTER TABLE `auth_verification_tokens` MODIFY COLUMN `token` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_accounts` ADD CONSTRAINT `auth_accounts_provider_account_id_unique` UNIQUE(`provider_account_id`);--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_session_token_unique` UNIQUE(`session_token`);--> statement-breakpoint
ALTER TABLE `auth_users` ADD CONSTRAINT `auth_users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `auth_verification_tokens` ADD CONSTRAINT `auth_verification_tokens_token_unique` UNIQUE(`token`);