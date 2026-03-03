import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull().unique(),
  tweetUrl: text("tweet_url"),
  title: text("title"),
  author: text("author"),
  description: text("description"),
  imageUrl: text("image_url"),
  siteName: text("site_name"),
  savedAt: integer("saved_at", { mode: "number" }).notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

