CREATE TABLE `history_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `observations` ADD `source_id` text;