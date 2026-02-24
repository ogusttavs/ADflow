CREATE TABLE `ab_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`channel` varchar(50) NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'draft',
	`variantAHeadline` text,
	`variantABody` text,
	`variantACta` text,
	`variantBHeadline` text,
	`variantBBody` text,
	`variantBCta` text,
	`variantAImpressions` int DEFAULT 0,
	`variantAClicks` int DEFAULT 0,
	`variantAConversions` int DEFAULT 0,
	`variantBImpressions` int DEFAULT 0,
	`variantBClicks` int DEFAULT 0,
	`variantBConversions` int DEFAULT 0,
	`winner` varchar(10),
	`aiInsights` text,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ab_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budget_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`totalBudget` int NOT NULL DEFAULT 0,
	`allocations` json,
	`aiSuggestions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budget_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`dueDate` varchar(10),
	`dueTime` varchar(5),
	`priority` varchar(10) NOT NULL DEFAULT 'MEDIUM',
	`status` varchar(10) NOT NULL DEFAULT 'PENDING',
	`category` varchar(20) NOT NULL DEFAULT 'WORK',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `habit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`habitId` int NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `habit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`color` varchar(20),
	`daysOfWeek` json,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `habits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`scheduledAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(30),
	`company` varchar(255),
	`position` varchar(150),
	`source` varchar(100),
	`stage` varchar(50) NOT NULL DEFAULT 'new',
	`score` int DEFAULT 0,
	`value` int DEFAULT 0,
	`tags` json,
	`notes` text,
	`aiGenerated` boolean DEFAULT false,
	`lastContactAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`campaignId` int,
	`platform` varchar(50) NOT NULL,
	`date` timestamp NOT NULL,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`spend` int DEFAULT 0,
	`revenue` int DEFAULT 0,
	`ctr` int DEFAULT 0,
	`cpc` int DEFAULT 0,
	`cpa` int DEFAULT 0,
	`roas` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) DEFAULT '#6366f1',
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pipeline_stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pomodoro_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(20) NOT NULL,
	`durationMinutes` int NOT NULL,
	`completedAt` timestamp,
	`label` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pomodoro_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredEmail` varchar(320) NOT NULL,
	`referredUserId` int,
	`code` varchar(20) NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'pending',
	`rewardType` varchar(50),
	`rewardValue` int,
	`convertedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`title` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL DEFAULT 'performance',
	`period` varchar(50),
	`metricsData` json,
	`aiSummary` text,
	`aiRecommendations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `utm_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`userId` int NOT NULL,
	`baseUrl` text NOT NULL,
	`utmSource` varchar(100),
	`utmMedium` varchar(100),
	`utmCampaign` varchar(200),
	`utmTerm` varchar(200),
	`utmContent` varchar(200),
	`fullUrl` text,
	`shortCode` varchar(20),
	`clicks` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `utm_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` varchar(100) NOT NULL DEFAULT 'system';--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);