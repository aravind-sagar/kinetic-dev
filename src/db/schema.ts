import { pgTable, text, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
					id: text("id").primaryKey(),
					name: text("name").notNull(),
					email: text("email").notNull().unique(),
					emailVerified: boolean("email_verified").notNull(),
					image: text("image"),
					twoFactorEnabled: boolean("two_factor_enabled").default(false),
					createdAt: timestamp("created_at").defaultNow().notNull(),
					updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const session = pgTable("session", {
					id: text("id").primaryKey(),
					expiresAt: timestamp("expires_at").notNull(),
					token: text("token").notNull().unique(),
					createdAt: timestamp("created_at").defaultNow().notNull(),
					updatedAt: timestamp("updated_at").defaultNow().notNull(),
					ipAddress: text("ip_address"),
					userAgent: text("user_agent"),
					userId: text("user_id").notNull().references(() => user.id)
});

export const account = pgTable("account", {
					id: text("id").primaryKey(),
					accountId: text("account_id").notNull(),
					providerId: text("provider_id").notNull(),
					userId: text("user_id").notNull().references(() => user.id),
					accessToken: text("access_token"),
					refreshToken: text("refresh_token"),
					idToken: text("id_token"),
					accessTokenExpiresAt: timestamp("access_token_expires_at"),
					refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
					scope: text("scope"),
					password: text("password"),
					createdAt: timestamp("created_at").defaultNow().notNull(),
					updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const verification = pgTable("verification", {
					id: text("id").primaryKey(),
					identifier: text("identifier").notNull(),
					value: text("value").notNull(),
					expiresAt: timestamp("expires_at").notNull(),
					createdAt: timestamp("created_at").defaultNow(),
					updatedAt: timestamp("updated_at").defaultNow()
});

export const passkey = pgTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  credentialID: text("credential_id").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull(),
  transports: text("transports"),
  createdAt: timestamp("created_at"),
});

export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
});

export const markdownDocs = pgTable("markdown_docs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const jsonFormatterState = pgTable("json_formatter_state", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const diffCheckerState = pgTable("diff_checker_state", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  input1: text("input1").notNull(),
  input2: text("input2").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const vscodeShortcuts = pgTable("vscode_shortcuts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  shortcuts: json("shortcuts").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const pages = pgTable("pages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  icon: text("icon"),
  group: text("group").default('All').notNull(),
  customActions: json("custom_actions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const userSettings = pgTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  persistentMode: boolean("persistent_mode").default(true).notNull(),
  globalVariables: json("global_variables"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const smartTemplates = pgTable("smart_templates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  content: text("content").notNull(),
  variables: json("variables"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const mailRules = pgTable("mail_rules", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  conditions: json("conditions").notNull(),
  action: json("action").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
