ALTER TABLE `users` ADD `firstName` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `lastName` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `whatsapp` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `acquisitionSource` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` varchar(80);--> statement-breakpoint
ALTER TABLE `users` ADD `marketingOptIn` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `taxIdType` enum('cpf','cnpj');--> statement-breakpoint
ALTER TABLE `users` ADD `taxIdEncrypted` text;--> statement-breakpoint
ALTER TABLE `users` ADD `taxIdLast4` varchar(4);