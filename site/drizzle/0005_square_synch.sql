CREATE TABLE `scraper_events` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `scraper_events_job_idx` ON `scraper_events` (`job_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `scraper_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`status` text NOT NULL,
	`config` text NOT NULL,
	`progress` text NOT NULL,
	`queued_at` text NOT NULL,
	`started_at` text,
	`finished_at` text,
	`lease_token` text,
	`lease_until` text,
	`cancel_requested` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `scraper_jobs_time_idx` ON `scraper_jobs` (`queued_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `scraper_jobs_active_idx` ON `scraper_jobs` (`site_id`) WHERE "scraper_jobs"."status" IN ('queued','running');--> statement-breakpoint
CREATE TABLE `scraper_sites` (
	`id` text PRIMARY KEY NOT NULL,
	`origin` text NOT NULL,
	`json` text NOT NULL,
	`next_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scraper_sites_origin_unique` ON `scraper_sites` (`origin`);