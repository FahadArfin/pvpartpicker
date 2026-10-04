CREATE TABLE `quarantine` (
	`id` text PRIMARY KEY NOT NULL,
	`json` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `observations` ADD `pack_quantity` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
UPDATE observations SET pack_quantity=COALESCE((SELECT json_extract(json,'$.packQuantity') FROM offers WHERE offers.id=observations.offer_id),1);
