import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().notNull(),
  email: text('email').notNull(),
  is_google_sync_enabled: boolean('is_google_sync_enabled').default(true).notNull(),
  google_refresh_token: text("google_refresh_token"),
  last_sync_at: timestamp("last_sync_at"),
  frica_shared_url: text('frica_shared_url'),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  source: text('source', { enum: ['google', 'frica'] }).notNull(),
  title: text('title').notNull(),
  start_at: timestamp('start_at').notNull(),
  end_at: timestamp('end_at'),
  is_all_day: boolean('is_all_day').default(false).notNull(),
  external_id: text('external_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})
