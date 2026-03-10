import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  googleId: text("google_id"),
  name: text("name"),
  image: text("image"),
  apiToken: text("api_token").notNull().unique(),
  tokenExpiresAt: integer("token_expires_at", { mode: "number" }),
  username: text("username").unique(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const links = sqliteTable(
  "links",
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
    favicon: text("favicon"),
    isRead: integer("is_read", { mode: "number" }).default(0),
    openedAt: integer("opened_at", { mode: "number" }),
    savedAt: integer("saved_at", { mode: "number" }).notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    urlUserUnique: uniqueIndex("links_url_user_unique").on(
      table.url,
      table.userId,
    ),
  }),
);

export const collections = sqliteTable(
  "collections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    isPublic: integer("is_public", { mode: "number" }).default(0),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("collections_slug_unique").on(table.slug),
  }),
);

export const collectionLinks = sqliteTable(
  "collection_links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    collectionId: integer("collection_id")
      .references(() => collections.id)
      .notNull(),
    linkId: integer("link_id")
      .references(() => links.id)
      .notNull(),
    sortOrder: integer("sort_order", { mode: "number" }),
    addedAt: integer("added_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    collectionLinkUnique: uniqueIndex("collection_links_collection_link_unique")
      .on(table.collectionId, table.linkId),
  }),
);

export const shares = sqliteTable("shares", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromUserId: integer("from_user_id")
    .references(() => users.id)
    .notNull(),
  toEmail: text("to_email").notNull(),
  toUserId: integer("to_user_id").references(() => users.id),
  linkId: integer("link_id").references(() => links.id),
  collectionId: integer("collection_id").references(() => collections.id),
  message: text("message"),
  seen: integer("seen", { mode: "number" }).default(0),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const publicWeeks = sqliteTable(
  "public_weeks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    weekStart: integer("week_start", { mode: "number" }).notNull(),
    isPublic: integer("is_public", { mode: "number" }).default(0),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    userWeekUnique: uniqueIndex("public_weeks_user_week_unique").on(
      table.userId,
      table.weekStart,
    ),
  }),
);

