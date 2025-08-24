import { db } from '../db';
import { peopleTable, relationshipsTable } from '../db/schema';
import { type CreateRelationshipInput, type Relationship } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createRelationship(input: CreateRelationshipInput): Promise<Relationship> {
  try {
    // Validate that parent and child are not the same person
    if (input.parent_id === input.child_id) {
      throw new Error('A person cannot be their own parent');
    }

    // Verify both people exist in the database
    const [parent, child] = await Promise.all([
      db.select()
        .from(peopleTable)
        .where(eq(peopleTable.id, input.parent_id))
        .execute(),
      db.select()
        .from(peopleTable)
        .where(eq(peopleTable.id, input.child_id))
        .execute()
    ]);

    if (parent.length === 0) {
      throw new Error(`Parent with ID ${input.parent_id} does not exist`);
    }

    if (child.length === 0) {
      throw new Error(`Child with ID ${input.child_id} does not exist`);
    }

    // Check if relationship already exists
    const existingRelationship = await db.select()
      .from(relationshipsTable)
      .where(
        and(
          eq(relationshipsTable.parent_id, input.parent_id),
          eq(relationshipsTable.child_id, input.child_id)
        )
      )
      .execute();

    if (existingRelationship.length > 0) {
      throw new Error('Relationship already exists between these people');
    }

    // Check for circular relationship (child cannot be parent of parent)
    const circularCheck = await db.select()
      .from(relationshipsTable)
      .where(
        and(
          eq(relationshipsTable.parent_id, input.child_id),
          eq(relationshipsTable.child_id, input.parent_id)
        )
      )
      .execute();

    if (circularCheck.length > 0) {
      throw new Error('Cannot create circular parent-child relationship');
    }

    // Create the relationship
    const result = await db.insert(relationshipsTable)
      .values({
        parent_id: input.parent_id,
        child_id: input.child_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Relationship creation failed:', error);
    throw error;
  }
}