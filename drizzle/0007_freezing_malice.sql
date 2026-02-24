CREATE TABLE `google_calendar_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`googleEmail` varchar(320),
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenType` varchar(32),
	`scope` text,
	`expiryDate` timestamp,
	`calendarId` varchar(255) NOT NULL DEFAULT 'primary',
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSyncAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_calendar_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_calendar_connections_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`linkedUserId` int NOT NULL,
	`type` enum('spouse','employee') NOT NULL,
	`sharePersonTypes` json NOT NULL,
	`permission` enum('view','edit') NOT NULL DEFAULT 'view',
	`shareProductivity` boolean NOT NULL DEFAULT false,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`invitedEmail` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_links_id` PRIMARY KEY(`id`)
);
