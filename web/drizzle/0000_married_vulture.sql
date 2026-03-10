CREATE TABLE `collection_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collection_id` integer NOT NULL,
	`link_id` integer NOT NULL,
	`sort_order` integer,
	`added_at` integer NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collection_links_collection_link_unique` ON `collection_links` (`collection_id`,`link_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`slug` text NOT NULL,
	`is_public` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE TABLE `links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`url` text NOT NULL,
	`tweet_url` text,
	`title` text,
	`author` text,
	`description` text,
	`image_url` text,
	`site_name` text,
	`favicon` text,
	`is_read` integer DEFAULT 0,
	`opened_at` integer,
	`saved_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `links_url_user_unique` ON `links` (`url`,`user_id`);--> statement-breakpoint
CREATE TABLE `public_weeks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`week_start` integer NOT NULL,
	`is_public` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `public_weeks_user_week_unique` ON `public_weeks` (`user_id`,`week_start`);--> statement-breakpoint
CREATE TABLE `shares` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_user_id` integer NOT NULL,
	`to_email` text NOT NULL,
	`to_user_id` integer,
	`link_id` integer,
	`collection_id` integer,
	`message` text,
	`seen` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`google_id` text,
	`name` text,
	`image` text,
	`api_token` text NOT NULL,
	`token_expires_at` integer,
	`username` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_api_token_unique` ON `users` (`api_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);