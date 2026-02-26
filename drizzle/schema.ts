import {
  boolean,
  int,
  json,
  longtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Core Users ────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  firstName: varchar("firstName", { length: 120 }),
  lastName: varchar("lastName", { length: 120 }),
  email: varchar("email", { length: 320 }),
  whatsapp: varchar("whatsapp", { length: 32 }),
  city: varchar("city", { length: 120 }),
  address: text("address"),
  acquisitionSource: varchar("acquisitionSource", { length: 255 }),
  preferredLanguage: varchar("preferredLanguage", { length: 80 }),
  marketingOptIn: boolean("marketingOptIn").notNull().default(false),
  taxIdType: mysqlEnum("taxIdType", ["cpf", "cnpj"]),
  taxIdEncrypted: text("taxIdEncrypted"),
  taxIdLast4: varchar("taxIdLast4", { length: 4 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerified: boolean("emailVerified").notNull().default(false),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  plan: mysqlEnum("plan", [
    "personal_standard",
    "personal_pro",
    "business_standard",
    "business_pro",
  ]),
  planStatus: mysqlEnum("planStatus", ["trial", "active", "past_due", "expired", "canceled"]),
  planExpiry: timestamp("planExpiry"),
  asaasCustomerId: varchar("asaasCustomerId", { length: 64 }),
  asaasSubscriptionId: varchar("asaasSubscriptionId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const authTokens = mysqlTable("auth_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["email_verification", "password_reset"]).notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuthToken = typeof authTokens.$inferSelect;
export type InsertAuthToken = typeof authTokens.$inferInsert;

export const processedWebhookEvents = mysqlTable("processed_webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["asaas"]).notNull().default("asaas"),
  eventId: varchar("eventId", { length: 128 }).notNull().unique(),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  processedAt: timestamp("processedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProcessedWebhookEvent = typeof processedWebhookEvents.$inferSelect;
export type InsertProcessedWebhookEvent = typeof processedWebhookEvents.$inferInsert;

// ─── Clients ───────────────────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner/manager
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  whatsappNumber: varchar("whatsappNumber", { length: 30 }),
  industry: varchar("industry", { length: 100 }),
  website: varchar("website", { length: 500 }),
  logoUrl: text("logoUrl"),
  status: mysqlEnum("status", ["active", "inactive", "pending"]).default("active").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["ok", "overdue"]).default("ok").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── Client Configs (dados pré-definidos) ──────────────────────────────────────
export const clientConfigs = mysqlTable("client_configs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().unique(),
  // Brand voice
  toneOfVoice: mysqlEnum("toneOfVoice", [
    "professional",
    "casual",
    "humorous",
    "inspirational",
    "educational",
    "urgent",
  ]).default("professional"),
  brandPersonality: text("brandPersonality"),
  // Target audience
  targetAudience: text("targetAudience"),
  ageRange: varchar("ageRange", { length: 50 }),
  gender: mysqlEnum("gender", ["all", "male", "female", "other"]).default("all"),
  location: text("location"),
  interests: text("interests"),
  // Products/Services
  productsServices: text("productsServices"),
  mainValueProposition: text("mainValueProposition"),
  competitors: text("competitors"),
  // Brand guidelines
  primaryColor: varchar("primaryColor", { length: 20 }),
  secondaryColor: varchar("secondaryColor", { length: 20 }),
  fontPreference: varchar("fontPreference", { length: 100 }),
  visualStyle: mysqlEnum("visualStyle", [
    "minimalist",
    "bold",
    "elegant",
    "playful",
    "corporate",
    "creative",
  ]).default("minimalist"),
  // Social channels
  activeChannels: json("activeChannels").$type<string[]>(),
  // Extra context
  additionalContext: text("additionalContext"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientConfig = typeof clientConfigs.$inferSelect;
export type InsertClientConfig = typeof clientConfigs.$inferInsert;

// ─── Campaigns ─────────────────────────────────────────────────────────────────
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  objective: text("objective"),
  requestedVia: mysqlEnum("requestedVia", ["web", "whatsapp", "api"]).default("web"),
  status: mysqlEnum("status", [
    "pending",
    "generating",
    "review",
    "approved",
    "scheduled",
    "publishing",
    "published",
    "failed",
    "cancelled",
  ]).default("pending").notNull(),
  // AI-generated strategy
  strategy: text("strategy"),
  keyMessages: text("keyMessages"),
  suggestedHashtags: text("suggestedHashtags"),
  callToAction: text("callToAction"),
  // Scheduling
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  // Metadata
  aiModel: varchar("aiModel", { length: 50 }),
  promptUsed: text("promptUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ─── Campaign Copies ───────────────────────────────────────────────────────────
export const campaignCopies = mysqlTable("campaign_copies", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  channel: mysqlEnum("channel", [
    "instagram_feed",
    "instagram_stories",
    "instagram_reels",
    "facebook_feed",
    "facebook_stories",
    "tiktok",
    "linkedin",
    "whatsapp",
    "email",
  ]).notNull(),
  headline: text("headline"),
  body: text("body"),
  hashtags: text("hashtags"),
  cta: text("cta"),
  characterCount: int("characterCount"),
  approved: boolean("approved").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CampaignCopy = typeof campaignCopies.$inferSelect;
export type InsertCampaignCopy = typeof campaignCopies.$inferInsert;

// ─── Campaign Creatives ────────────────────────────────────────────────────────
export const campaignCreatives = mysqlTable("campaign_creatives", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  type: mysqlEnum("type", ["image", "video", "carousel", "story"]).default("image"),
  channel: varchar("channel", { length: 50 }),
  imageUrl: text("imageUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  freepikAssetId: varchar("freepikAssetId", { length: 100 }),
  prompt: text("prompt"),
  approved: boolean("approved").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CampaignCreative = typeof campaignCreatives.$inferSelect;
export type InsertCampaignCreative = typeof campaignCreatives.$inferInsert;

// ─── Social Accounts ───────────────────────────────────────────────────────────
export const socialAccounts = mysqlTable("social_accounts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  platform: mysqlEnum("platform", [
    "instagram",
    "facebook",
    "tiktok",
    "linkedin",
    "youtube",
  ]).notNull(),
  accountName: varchar("accountName", { length: 255 }),
  accountId: varchar("accountId", { length: 255 }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  pageId: varchar("pageId", { length: 255 }),
  isConnected: boolean("isConnected").default(false),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = typeof socialAccounts.$inferInsert;

// ─── Scheduled Posts ───────────────────────────────────────────────────────────
export const scheduledPosts = mysqlTable("scheduled_posts", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  copyId: int("copyId"),
  creativeId: int("creativeId"),
  socialAccountId: int("socialAccountId").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  content: text("content"),
  mediaUrl: text("mediaUrl"),
  scheduledAt: timestamp("scheduledAt").notNull(),
  publishedAt: timestamp("publishedAt"),
  platformPostId: varchar("platformPostId", { length: 255 }),
  status: mysqlEnum("status", [
    "scheduled",
    "publishing",
    "published",
    "failed",
    "cancelled",
  ]).default("scheduled").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = typeof scheduledPosts.$inferInsert;

// ─── WhatsApp Sessions ─────────────────────────────────────────────────────────
export const whatsappSessions = mysqlTable("whatsapp_sessions", {
  id: int("id").autoincrement().primaryKey(),
  phoneNumber: varchar("phoneNumber", { length: 30 }).notNull(),
  clientId: int("clientId"),
  state: mysqlEnum("state", [
    "idle",
    "collecting_objective",
    "collecting_channels",
    "collecting_date",
    "generating",
    "review",
    "completed",
  ]).default("idle").notNull(),
  context: json("context").$type<Record<string, unknown>>(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow(),
  campaignId: int("campaignId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappSession = typeof whatsappSessions.$inferSelect;
export type InsertWhatsappSession = typeof whatsappSessions.$inferInsert;

// ─── Notifications ─────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 100 }).notNull().default("system"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  relatedId: int("relatedId"),
  relatedType: varchar("relatedType", { length: 50 }),
  read: boolean("read").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── CRM: Leads ───────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 150 }),
  source: varchar("source", { length: 100 }),
  stage: varchar("stage", { length: 50 }).notNull().default("new"),
  score: int("score").default(0),
  value: int("value").default(0),
  tags: json("tags").$type<string[]>(),
  notes: text("notes"),
  aiGenerated: boolean("aiGenerated").default(false),
  lastContactAt: timestamp("lastContactAt"),
  followUpCount: int("followUpCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── CRM: Pipeline Stages ─────────────────────────────────────────────────────
export const pipelineStages = mysqlTable("pipeline_stages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#6366f1"),
  position: int("position").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = typeof pipelineStages.$inferInsert;

// ─── CRM: Lead Activities ─────────────────────────────────────────────────────
export const leadActivities = mysqlTable("lead_activities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduledAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = typeof leadActivities.$inferInsert;

// ─── A/B Tests ────────────────────────────────────────────────────────────────
export const abTests = mysqlTable("ab_tests", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
  variantAHeadline: text("variantAHeadline"),
  variantABody: text("variantABody"),
  variantACta: text("variantACta"),
  variantBHeadline: text("variantBHeadline"),
  variantBBody: text("variantBBody"),
  variantBCta: text("variantBCta"),
  variantAImpressions: int("variantAImpressions").default(0),
  variantAClicks: int("variantAClicks").default(0),
  variantAConversions: int("variantAConversions").default(0),
  variantBImpressions: int("variantBImpressions").default(0),
  variantBClicks: int("variantBClicks").default(0),
  variantBConversions: int("variantBConversions").default(0),
  winner: varchar("winner", { length: 10 }),
  aiInsights: text("aiInsights"),
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AbTest = typeof abTests.$inferSelect;
export type InsertAbTest = typeof abTests.$inferInsert;

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId"),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("performance"),
  period: varchar("period", { length: 50 }),
  metricsData: json("metricsData").$type<Record<string, unknown>>(),
  aiSummary: text("aiSummary"),
  aiRecommendations: text("aiRecommendations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ─── UTM Tracking ─────────────────────────────────────────────────────────────
export const utmLinks = mysqlTable("utm_links", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  userId: int("userId").notNull(),
  baseUrl: text("baseUrl").notNull(),
  utmSource: varchar("utmSource", { length: 100 }),
  utmMedium: varchar("utmMedium", { length: 100 }),
  utmCampaign: varchar("utmCampaign", { length: 200 }),
  utmTerm: varchar("utmTerm", { length: 200 }),
  utmContent: varchar("utmContent", { length: 200 }),
  fullUrl: text("fullUrl"),
  shortCode: varchar("shortCode", { length: 20 }),
  clicks: int("clicks").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UtmLink = typeof utmLinks.$inferSelect;
export type InsertUtmLink = typeof utmLinks.$inferInsert;

// ─── Referrals (Programa de Indicação) ────────────────────────────────────────
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredEmail: varchar("referredEmail", { length: 320 }).notNull(),
  referredUserId: int("referredUserId"),
  code: varchar("code", { length: 20 }).notNull().unique(),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  rewardType: varchar("rewardType", { length: 50 }),
  rewardValue: int("rewardValue"),
  convertedAt: timestamp("convertedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// ─── Budget Allocations ───────────────────────────────────────────────────────
export const budgetAllocations = mysqlTable("budget_allocations", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  totalBudget: int("totalBudget").notNull().default(0),
  allocations: json("allocations").$type<Record<string, number>>(),
  aiSuggestions: text("aiSuggestions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BudgetAllocation = typeof budgetAllocations.$inferSelect;
export type InsertBudgetAllocation = typeof budgetAllocations.$inferInsert;

// ─── Performance Metrics (per channel per day) ────────────────────────────────
export const performanceMetrics = mysqlTable("performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  campaignId: int("campaignId"),
  platform: varchar("platform", { length: 50 }).notNull(),
  date: timestamp("date").notNull(),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  conversions: int("conversions").default(0),
  spend: int("spend").default(0),
  revenue: int("revenue").default(0),
  ctr: int("ctr").default(0),
  cpc: int("cpc").default(0),
  cpa: int("cpa").default(0),
  roas: int("roas").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

// ─── Productivity: Habits ─────────────────────────────────────────────────────
export const habits = mysqlTable("habits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  daysOfWeek: json("daysOfWeek").$type<number[]>(), // 0=Sun, 1=Mon, ..., 6=Sat
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Habit = typeof habits.$inferSelect;

// ─── Productivity: Habit Logs ─────────────────────────────────────────────────
export const habitLogs = mysqlTable("habit_logs", {
  id: int("id").autoincrement().primaryKey(),
  habitId: int("habitId").notNull(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HabitLog = typeof habitLogs.$inferSelect;

// ─── Productivity: Pomodoro Sessions ──────────────────────────────────────────
export const pomodoroSessions = mysqlTable("pomodoro_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // work, short_break, long_break
  durationMinutes: int("durationMinutes").notNull(),
  completedAt: timestamp("completedAt"),
  label: varchar("label", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PomodoroSession = typeof pomodoroSessions.$inferSelect;

// ─── Productivity: Daily Tasks ────────────────────────────────────────────────
export const dailyTasks = mysqlTable("daily_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  dueDate: varchar("dueDate", { length: 10 }), // YYYY-MM-DD
  dueTime: varchar("dueTime", { length: 5 }), // HH:MM
  priority: varchar("priority", { length: 10 }).default("MEDIUM").notNull(), // HIGH, MEDIUM, LOW
  status: varchar("status", { length: 10 }).default("PENDING").notNull(), // PENDING, DONE, ARCHIVED
  category: varchar("category", { length: 20 }).default("WORK").notNull(), // WORK, PERSONAL, OTHER
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyTask = typeof dailyTasks.$inferSelect;

// ─── Financeiro: Transactions ──────────────────────────────────────────────────
export const financeiroTransactions = mysqlTable("financeiro_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  personType: mysqlEnum("personType", ["cpf", "cnpj"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: int("amount").notNull(), // in cents
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  receiptFileId: int("receiptFileId"), // nullable FK to fileAttachments
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinanceiroTransaction = typeof financeiroTransactions.$inferSelect;
export type InsertFinanceiroTransaction = typeof financeiroTransactions.$inferInsert;

// ─── Financeiro: Recurring Items ───────────────────────────────────────────────
export const financeiroRecurring = mysqlTable("financeiro_recurring", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  personType: mysqlEnum("personType", ["cpf", "cnpj"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: int("amount").notNull(), // in cents
  recurringDay: int("recurringDay").notNull(), // 1-31 day of month
  active: boolean("active").default(true).notNull(),
  endType: mysqlEnum("endType", ["indefinite", "month"]).default("indefinite").notNull(),
  endMonth: varchar("endMonth", { length: 7 }), // YYYY-MM, null = indefinite
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinanceiroRecurring = typeof financeiroRecurring.$inferSelect;

// ─── Client Billing Config ─────────────────────────────────────────────────────
export const clientBilling = mysqlTable("client_billing", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId").notNull(),
  billingDay: int("billingDay").notNull(), // day of month 1-31
  amount: int("amount").notNull(), // in cents
  description: varchar("description", { length: 255 }).notNull(),
  personType: mysqlEnum("personType", ["cpf", "cnpj"]).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientBilling = typeof clientBilling.$inferSelect;

// ─── Client Payment Records ────────────────────────────────────────────────────
export const clientPaymentRecords = mysqlTable("client_payment_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId").notNull(),
  billingId: int("billingId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  dueDate: varchar("dueDate", { length: 10 }).notNull(), // YYYY-MM-DD
  amount: int("amount").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "overdue"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  notes: varchar("notes", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientPaymentRecord = typeof clientPaymentRecords.$inferSelect;

// ─── File Attachments ──────────────────────────────────────────────────────────
export const fileAttachments = mysqlTable("file_attachments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  entityType: mysqlEnum("entityType", [
    "financeiro_receipt",
    "client_creative",
    "client_document",
  ]).notNull(),
  entityId: int("entityId"), // clientId for client files; transactionId (nullable) for receipts
  personType: mysqlEnum("personType", ["cpf", "cnpj"]), // for financeiro_receipt
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  size: int("size").notNull(), // bytes
  base64Content: longtext("base64Content").notNull(),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileAttachment = typeof fileAttachments.$inferSelect;

// ─── Client Credentials ────────────────────────────────────────────────────────
export const clientCredentials = mysqlTable("client_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId").notNull(),
  service: varchar("service", { length: 100 }).notNull(),
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 500 }),
  url: varchar("url", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientCredential = typeof clientCredentials.$inferSelect;

// ─── Client Intake Forms ───────────────────────────────────────────────────────
export const clientIntakeForms = mysqlTable("client_intake_forms", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId").notNull().unique(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull().default("Formulário de Onboarding"),
  description: text("description"),
  fields: json("fields").$type<Array<{
    id: string;
    type: "text" | "textarea" | "select" | "email" | "phone" | "url";
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // for select type
  }>>(),
  responses: json("responses").$type<Record<string, string>>(),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientIntakeForm = typeof clientIntakeForms.$inferSelect;

// ─── Financeiro: Custom Categories ─────────────────────────────────────────────
export const financeiroCategories = mysqlTable("financeiro_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  personType: mysqlEnum("personType", ["cpf", "cnpj"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinanceiroCategory = typeof financeiroCategories.$inferSelect;

// ─── Diary Entries ─────────────────────────────────────────────────────────────
export const diaryEntries = mysqlTable("diary_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD (unique per user)
  content: longtext("content").notNull(),
  mood: varchar("mood", { length: 50 }), // emoji or label
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiaryEntry = typeof diaryEntries.$inferSelect;

// ─── Dream Board Items ─────────────────────────────────────────────────────────
export const dreamItems = mysqlTable("dream_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageBase64: longtext("imageBase64"), // base64 uploaded image
  imageUrl: text("imageUrl"),           // external image URL
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DreamItem = typeof dreamItems.$inferSelect;

// ─── User Links (Cônjuge / Funcionário) ────────────────────────────────────────
export const userLinks = mysqlTable("user_links", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),           // who sent the invite
  linkedUserId: int("linkedUserId").notNull(), // who was invited
  type: mysqlEnum("type", ["spouse", "employee"]).notNull(),
  sharePersonTypes: json("sharePersonTypes").$type<Array<"cpf" | "cnpj">>().notNull(),
  permission: mysqlEnum("permission", ["view", "edit"]).default("view").notNull(),
  shareProductivity: boolean("shareProductivity").default(false).notNull(), // spouse only
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  invitedEmail: varchar("invitedEmail", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserLink = typeof userLinks.$inferSelect;

// ─── Google Calendar Connections ────────────────────────────────────────────────
export const googleCalendarConnections = mysqlTable("google_calendar_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  googleEmail: varchar("googleEmail", { length: 320 }),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenType: varchar("tokenType", { length: 32 }),
  scope: text("scope"),
  expiryDate: timestamp("expiryDate"),
  calendarId: varchar("calendarId", { length: 255 }).notNull().default("primary"),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoogleCalendarConnection = typeof googleCalendarConnections.$inferSelect;
