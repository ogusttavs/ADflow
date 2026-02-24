CREATE TABLE `campaign_copies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`channel` enum('instagram_feed','instagram_stories','instagram_reels','facebook_feed','facebook_stories','tiktok','linkedin','whatsapp','email') NOT NULL,
	`headline` text,
	`body` text,
	`hashtags` text,
	`cta` text,
	`characterCount` int,
	`approved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaign_copies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaign_creatives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`type` enum('image','video','carousel','story') DEFAULT 'image',
	`channel` varchar(50),
	`imageUrl` text,
	`thumbnailUrl` text,
	`freepikAssetId` varchar(100),
	`prompt` text,
	`approved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaign_creatives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`objective` text,
	`requestedVia` enum('web','whatsapp','api') DEFAULT 'web',
	`status` enum('pending','generating','review','approved','scheduled','publishing','published','failed','cancelled') NOT NULL DEFAULT 'pending',
	`strategy` text,
	`keyMessages` text,
	`suggestedHashtags` text,
	`callToAction` text,
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`aiModel` varchar(50),
	`promptUsed` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`toneOfVoice` enum('professional','casual','humorous','inspirational','educational','urgent') DEFAULT 'professional',
	`brandPersonality` text,
	`targetAudience` text,
	`ageRange` varchar(50),
	`gender` enum('all','male','female','other') DEFAULT 'all',
	`location` text,
	`interests` text,
	`productsServices` text,
	`mainValueProposition` text,
	`competitors` text,
	`primaryColor` varchar(20),
	`secondaryColor` varchar(20),
	`fontPreference` varchar(100),
	`visualStyle` enum('minimalist','bold','elegant','playful','corporate','creative') DEFAULT 'minimalist',
	`activeChannels` json DEFAULT ('[]'),
	`additionalContext` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_configs_clientId_unique` UNIQUE(`clientId`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`company` varchar(255),
	`email` varchar(320),
	`phone` varchar(30),
	`whatsappNumber` varchar(30),
	`industry` varchar(100),
	`website` varchar(500),
	`logoUrl` text,
	`status` enum('active','inactive','pending') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('new_campaign_request','campaign_generated','campaign_approved','post_published','post_failed','client_connected','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`relatedId` int,
	`relatedType` varchar(50),
	`read` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`copyId` int,
	`creativeId` int,
	`socialAccountId` int NOT NULL,
	`platform` varchar(50) NOT NULL,
	`content` text,
	`mediaUrl` text,
	`scheduledAt` timestamp NOT NULL,
	`publishedAt` timestamp,
	`platformPostId` varchar(255),
	`status` enum('scheduled','publishing','published','failed','cancelled') NOT NULL DEFAULT 'scheduled',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`platform` enum('instagram','facebook','tiktok','linkedin','youtube') NOT NULL,
	`accountName` varchar(255),
	`accountId` varchar(255),
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`pageId` varchar(255),
	`isConnected` boolean DEFAULT false,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phoneNumber` varchar(30) NOT NULL,
	`clientId` int,
	`state` enum('idle','collecting_objective','collecting_channels','collecting_date','generating','review','completed') NOT NULL DEFAULT 'idle',
	`context` json DEFAULT ('{}'),
	`lastMessageAt` timestamp DEFAULT (now()),
	`campaignId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_sessions_id` PRIMARY KEY(`id`)
);
