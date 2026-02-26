CREATE TABLE `processed_webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('asaas') NOT NULL DEFAULT 'asaas',
	`eventId` varchar(128) NOT NULL,
	`eventType` varchar(120) NOT NULL,
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `processed_webhook_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `processed_webhook_events_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `plan` enum('personal_standard','personal_pro','business_standard','business_pro');--> statement-breakpoint
ALTER TABLE `users` ADD `planStatus` enum('trial','active','past_due','expired','canceled');--> statement-breakpoint
ALTER TABLE `users` ADD `planExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `asaasCustomerId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `asaasSubscriptionId` varchar(64);