CREATE TABLE `diary_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`content` longtext NOT NULL,
	`mood` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diary_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dream_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`imageBase64` longtext,
	`imageUrl` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dream_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financeiro_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`personType` enum('cpf','cnpj') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financeiro_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `financeiro_recurring` ADD `endType` enum('indefinite','month') DEFAULT 'indefinite' NOT NULL;--> statement-breakpoint
ALTER TABLE `financeiro_recurring` ADD `endMonth` varchar(7);--> statement-breakpoint
ALTER TABLE `financeiro_transactions` ADD `receiptFileId` int;