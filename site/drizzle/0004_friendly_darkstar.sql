CREATE TABLE `community_builds` (
	`build_id` text PRIMARY KEY NOT NULL,
	`share_id` text NOT NULL,
	`json` text NOT NULL,
	`description` text NOT NULL,
	`published_at` text NOT NULL,
	FOREIGN KEY (`build_id`) REFERENCES `builds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_builds_share_id_unique` ON `community_builds` (`share_id`);--> statement-breakpoint
CREATE INDEX `community_published_idx` ON `community_builds` (`published_at`);