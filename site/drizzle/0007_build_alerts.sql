CREATE TABLE `build_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`build_id` text NOT NULL,
	`email` text NOT NULL,
	`target` real NOT NULL,
	`email_enabled` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`token` text NOT NULL,
	`created_at` text NOT NULL,
	`last_price` real,
	`build_signature` text,
	`revision` integer DEFAULT 0 NOT NULL
);

--> statement-breakpoint
CREATE UNIQUE INDEX `build_alerts_token_unique` ON `build_alerts` (`token`);
--> statement-breakpoint
CREATE UNIQUE INDEX `build_alerts_owner_build_idx` ON `build_alerts` (`user_id`,`build_id`);
--> statement-breakpoint
CREATE INDEX `build_alerts_active_idx` ON `build_alerts` (`active`,`id`);
--> statement-breakpoint
ALTER TABLE `notifications` ADD `build_id` text;
--> statement-breakpoint
ALTER TABLE `notifications` ADD `build_signature` text;
