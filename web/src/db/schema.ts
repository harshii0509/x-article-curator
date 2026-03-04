import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  apiToken: text("api_token").notNull().unique(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id),
    url: text("url").notNull(),
    tweetUrl: text("tweet_url"),
    title: text("title"),
    author: text("author"),
    description: text("description"),
    imageUrl: text("image_url"),
    siteName: text("site_name"),
    isRead: integer("is_read", { mode: "number" }).default(0),
    openedAt: integer("opened_at", { mode: "number" }),
    savedAt: integer("saved_at", { mode: "number" }).notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    urlUserUnique: uniqueIndex("articles_url_user_unique").on(
      table.url,
      table.userId,
    ),
  }),
);

export const otpCodes = sqliteTable("otp_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: integer("expires_at", { mode: "number" }).notNull(),
  used: integer("used", { mode: "number" }).notNull().default(0),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

