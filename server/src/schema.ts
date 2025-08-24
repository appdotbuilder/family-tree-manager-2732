import { z } from 'zod';

// Person schema for database representation
export const personSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  birth_date: z.coerce.date().nullable(),
  death_date: z.coerce.date().nullable(),
  photo_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Person = z.infer<typeof personSchema>;

// Relationship schema for parent-child connections
export const relationshipSchema = z.object({
  id: z.number(),
  parent_id: z.number(),
  child_id: z.number(),
  created_at: z.coerce.date()
});

export type Relationship = z.infer<typeof relationshipSchema>;

// Input schema for creating a person
export const createPersonInputSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  birth_date: z.coerce.date().nullable(),
  death_date: z.coerce.date().nullable(),
  photo_url: z.string().url().nullable()
});

export type CreatePersonInput = z.infer<typeof createPersonInputSchema>;

// Input schema for updating a person
export const updatePersonInputSchema = z.object({
  id: z.number(),
  full_name: z.string().min(1, "Full name is required").optional(),
  birth_date: z.coerce.date().nullable().optional(),
  death_date: z.coerce.date().nullable().optional(),
  photo_url: z.string().url().nullable().optional()
});

export type UpdatePersonInput = z.infer<typeof updatePersonInputSchema>;

// Input schema for creating a parent-child relationship
export const createRelationshipInputSchema = z.object({
  parent_id: z.number(),
  child_id: z.number()
});

export type CreateRelationshipInput = z.infer<typeof createRelationshipInputSchema>;

// Input schema for deleting a relationship
export const deleteRelationshipInputSchema = z.object({
  parent_id: z.number(),
  child_id: z.number()
});

export type DeleteRelationshipInput = z.infer<typeof deleteRelationshipInputSchema>;

// Schema for person with relationships (for family tree visualization)
export const personWithRelationshipsSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  birth_date: z.coerce.date().nullable(),
  death_date: z.coerce.date().nullable(),
  photo_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  parents: z.array(personSchema),
  children: z.array(personSchema)
});

export type PersonWithRelationships = z.infer<typeof personWithRelationshipsSchema>;

// Input schema for getting a person by ID
export const getPersonInputSchema = z.object({
  id: z.number()
});

export type GetPersonInput = z.infer<typeof getPersonInputSchema>;