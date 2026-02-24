CREATE TABLE `client_billing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int NOT NULL,
	`billingDay` int NOT NULL,
	`amount` int NOT NULL,
	`description` varchar(255) NOT NULL,
	`personType` enum('cpf','cnpj') NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_billing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int NOT NULL,
	`service` varchar(100) NOT NULL,
	`username` varchar(255),
	`password` varchar(500),
	`url` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_intake_forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL DEFAULT 'Formulário de Onboarding',
	`description` text,
	`fields` json,
	`responses` json,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_intake_forms_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_intake_forms_clientId_unique` UNIQUE(`clientId`),
	CONSTRAINT `client_intake_forms_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `client_payment_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int NOT NULL,
	`billingId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`dueDate` varchar(10) NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','paid','overdue') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`notes` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_payment_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` enum('financeiro_receipt','client_creative','client_document') NOT NULL,
	`entityId` int,
	`personType` enum('cpf','cnpj'),
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`size` int NOT NULL,
	`base64Content` longtext NOT NULL,
	`description` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financeiro_recurring` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`personType` enum('cpf','cnpj') NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`recurringDay` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financeiro_recurring_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD `paymentStatus` enum('ok','overdue') DEFAULT 'ok' NOT NULL;