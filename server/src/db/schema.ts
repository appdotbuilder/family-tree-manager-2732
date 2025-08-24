import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// People table - stores individual family members
export const peopleTable = pgTable('people', {
  id: serial('id').primaryKey(),
  full_name: text('full_name').notNull(),
  birth_date: timestamp('birth_date'), // Nullable - birth date might be unknown
  death_date: timestamp('death_date'), // Nullable - person might be alive
  photo_url: text('photo_url'), // Nullable - photo is optional
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relationships table - stores parent-child relationships
export const relationshipsTable = pgTable('relationships', {
  id: serial('id').primaryKey(),
  parent_id: integer('parent_id').notNull().references(() => peopleTable.id, { onDelete: 'cascade' }),
  child_id: integer('child_id').notNull().references(() => peopleTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations for query building
export const peopleRelations = relations(peopleTable, ({ many }) => ({
  childRelationships: many(relationshipsTable, { relationName: 'parent' }),
  parentRelationships: many(relationshipsTable, { relationName: 'child' })
}));

export const relationshipsRelations = relations(relationshipsTable, ({ one }) => ({
  parent: one(peopleTable, {
    fields: [relationshipsTable.parent_id],
    references: [peopleTable.id],
    relationName: 'parent'
  }),
  child: one(peopleTable, {
    fields: [relationshipsTable.child_id],
    references: [peopleTable.id],
    relationName: 'child'
  })
}));

// TypeScript types for the table schemas
export type Person = typeof peopleTable.$inferSelect; // For SELECT operations
export type NewPerson = typeof peopleTable.$inferInsert; // For INSERT operations

export type Relationship = typeof relationshipsTable.$inferSelect; // For SELECT operations
export type NewRelationship = typeof relationshipsTable.$inferInsert; // For INSERT operations

// Export all tables and relations for proper query building
export const tables = { 
  people: peopleTable, 
  relationships: relationshipsTable 
};