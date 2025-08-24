import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { peopleTable, relationshipsTable } from '../db/schema';
import { type DeleteRelationshipInput } from '../schema';
import { deleteRelationship } from '../handlers/delete_relationship';
import { eq, and } from 'drizzle-orm';

describe('deleteRelationship', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing relationship', async () => {
    // Create test people
    const people = await db.insert(peopleTable)
      .values([
        { full_name: 'Parent Person', birth_date: new Date('1970-01-01') },
        { full_name: 'Child Person', birth_date: new Date('2000-01-01') }
      ])
      .returning()
      .execute();

    const [parent, child] = people;

    // Create relationship
    await db.insert(relationshipsTable)
      .values({
        parent_id: parent.id,
        child_id: child.id
      })
      .execute();

    // Test input
    const input: DeleteRelationshipInput = {
      parent_id: parent.id,
      child_id: child.id
    };

    // Delete relationship
    const result = await deleteRelationship(input);

    // Verify success
    expect(result.success).toBe(true);

    // Verify relationship was actually deleted from database
    const relationships = await db.select()
      .from(relationshipsTable)
      .where(
        and(
          eq(relationshipsTable.parent_id, parent.id),
          eq(relationshipsTable.child_id, child.id)
        )
      )
      .execute();

    expect(relationships).toHaveLength(0);
  });

  it('should return false when relationship does not exist', async () => {
    // Create test people but no relationship
    const people = await db.insert(peopleTable)
      .values([
        { full_name: 'Parent Person', birth_date: new Date('1970-01-01') },
        { full_name: 'Child Person', birth_date: new Date('2000-01-01') }
      ])
      .returning()
      .execute();

    const [parent, child] = people;

    // Test input for non-existent relationship
    const input: DeleteRelationshipInput = {
      parent_id: parent.id,
      child_id: child.id
    };

    // Try to delete non-existent relationship
    const result = await deleteRelationship(input);

    // Verify failure
    expect(result.success).toBe(false);
  });

  it('should return false when parent does not exist', async () => {
    // Create only child person
    const people = await db.insert(peopleTable)
      .values([
        { full_name: 'Child Person', birth_date: new Date('2000-01-01') }
      ])
      .returning()
      .execute();

    const [child] = people;

    // Test input with non-existent parent ID
    const input: DeleteRelationshipInput = {
      parent_id: 99999, // Non-existent ID
      child_id: child.id
    };

    // Try to delete relationship with non-existent parent
    const result = await deleteRelationship(input);

    // Verify failure
    expect(result.success).toBe(false);
  });

  it('should return false when child does not exist', async () => {
    // Create only parent person
    const people = await db.insert(peopleTable)
      .values([
        { full_name: 'Parent Person', birth_date: new Date('1970-01-01') }
      ])
      .returning()
      .execute();

    const [parent] = people;

    // Test input with non-existent child ID
    const input: DeleteRelationshipInput = {
      parent_id: parent.id,
      child_id: 99999 // Non-existent ID
    };

    // Try to delete relationship with non-existent child
    const result = await deleteRelationship(input);

    // Verify failure
    expect(result.success).toBe(false);
  });

  it('should only delete the specific relationship', async () => {
    // Create test people
    const people = await db.insert(peopleTable)
      .values([
        { full_name: 'Parent 1', birth_date: new Date('1970-01-01') },
        { full_name: 'Parent 2', birth_date: new Date('1972-01-01') },
        { full_name: 'Child', birth_date: new Date('2000-01-01') }
      ])
      .returning()
      .execute();

    const [parent1, parent2, child] = people;

    // Create multiple relationships
    await db.insert(relationshipsTable)
      .values([
        { parent_id: parent1.id, child_id: child.id },
        { parent_id: parent2.id, child_id: child.id }
      ])
      .execute();

    // Test input to delete only one relationship
    const input: DeleteRelationshipInput = {
      parent_id: parent1.id,
      child_id: child.id
    };

    // Delete specific relationship
    const result = await deleteRelationship(input);

    // Verify success
    expect(result.success).toBe(true);

    // Verify only the specific relationship was deleted
    const remainingRelationships = await db.select()
      .from(relationshipsTable)
      .execute();

    expect(remainingRelationships).toHaveLength(1);
    expect(remainingRelationships[0].parent_id).toBe(parent2.id);
    expect(remainingRelationships[0].child_id).toBe(child.id);
  });

  it('should handle multiple deletions of the same relationship gracefully', async () => {
    // Create test people
    const people = await db.insert(peopleTable)
      .values([
        { full_name: 'Parent Person', birth_date: new Date('1970-01-01') },
        { full_name: 'Child Person', birth_date: new Date('2000-01-01') }
      ])
      .returning()
      .execute();

    const [parent, child] = people;

    // Create relationship
    await db.insert(relationshipsTable)
      .values({
        parent_id: parent.id,
        child_id: child.id
      })
      .execute();

    const input: DeleteRelationshipInput = {
      parent_id: parent.id,
      child_id: child.id
    };

    // First deletion should succeed
    const firstResult = await deleteRelationship(input);
    expect(firstResult.success).toBe(true);

    // Second deletion should fail (relationship no longer exists)
    const secondResult = await deleteRelationship(input);
    expect(secondResult.success).toBe(false);

    // Verify no relationships remain
    const relationships = await db.select()
      .from(relationshipsTable)
      .execute();

    expect(relationships).toHaveLength(0);
  });
});