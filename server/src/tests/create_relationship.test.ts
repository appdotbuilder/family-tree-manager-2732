import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { peopleTable, relationshipsTable } from '../db/schema';
import { type CreateRelationshipInput } from '../schema';
import { createRelationship } from '../handlers/create_relationship';
import { eq, and } from 'drizzle-orm';

describe('createRelationship', () => {
  let parentId: number;
  let childId: number;
  let grandparentId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test people for relationships
    const people = await db.insert(peopleTable)
      .values([
        {
          full_name: 'John Doe',
          birth_date: new Date('1950-01-01'),
          death_date: null,
          photo_url: null
        },
        {
          full_name: 'Jane Smith',
          birth_date: new Date('1980-01-01'),
          death_date: null,
          photo_url: null
        },
        {
          full_name: 'Bob Elder',
          birth_date: new Date('1925-01-01'),
          death_date: null,
          photo_url: null
        }
      ])
      .returning()
      .execute();

    grandparentId = people[0].id;
    parentId = people[1].id;
    childId = people[2].id;
  });

  afterEach(resetDB);

  const testInput: CreateRelationshipInput = {
    parent_id: 0, // Will be set in tests
    child_id: 0   // Will be set in tests
  };

  it('should create a valid relationship', async () => {
    const input = {
      ...testInput,
      parent_id: parentId,
      child_id: childId
    };

    const result = await createRelationship(input);

    expect(result.id).toBeDefined();
    expect(result.parent_id).toEqual(parentId);
    expect(result.child_id).toEqual(childId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save relationship to database', async () => {
    const input = {
      ...testInput,
      parent_id: parentId,
      child_id: childId
    };

    const result = await createRelationship(input);

    const relationships = await db.select()
      .from(relationshipsTable)
      .where(eq(relationshipsTable.id, result.id))
      .execute();

    expect(relationships).toHaveLength(1);
    expect(relationships[0].parent_id).toEqual(parentId);
    expect(relationships[0].child_id).toEqual(childId);
    expect(relationships[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject relationship where parent_id equals child_id', async () => {
    const input = {
      ...testInput,
      parent_id: parentId,
      child_id: parentId
    };

    await expect(createRelationship(input)).rejects.toThrow(/cannot be their own parent/i);
  });

  it('should reject relationship with non-existent parent', async () => {
    const input = {
      ...testInput,
      parent_id: 99999, // Non-existent ID
      child_id: childId
    };

    await expect(createRelationship(input)).rejects.toThrow(/parent with id 99999 does not exist/i);
  });

  it('should reject relationship with non-existent child', async () => {
    const input = {
      ...testInput,
      parent_id: parentId,
      child_id: 99999 // Non-existent ID
    };

    await expect(createRelationship(input)).rejects.toThrow(/child with id 99999 does not exist/i);
  });

  it('should reject duplicate relationship', async () => {
    const input = {
      ...testInput,
      parent_id: parentId,
      child_id: childId
    };

    // Create the relationship first time
    await createRelationship(input);

    // Try to create the same relationship again
    await expect(createRelationship(input)).rejects.toThrow(/relationship already exists/i);
  });

  it('should reject circular relationship', async () => {
    // First create parent -> child relationship
    await createRelationship({
      parent_id: parentId,
      child_id: childId
    });

    // Try to create child -> parent relationship (circular)
    const circularInput = {
      ...testInput,
      parent_id: childId,
      child_id: parentId
    };

    await expect(createRelationship(circularInput)).rejects.toThrow(/circular parent-child relationship/i);
  });

  it('should allow creating multiple relationships for same parent', async () => {
    // Create additional child for testing
    const [additionalChild] = await db.insert(peopleTable)
      .values({
        full_name: 'Additional Child',
        birth_date: new Date('2000-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create first relationship
    await createRelationship({
      parent_id: parentId,
      child_id: childId
    });

    // Create second relationship with same parent, different child
    const result = await createRelationship({
      parent_id: parentId,
      child_id: additionalChild.id
    });

    expect(result.parent_id).toEqual(parentId);
    expect(result.child_id).toEqual(additionalChild.id);

    // Verify both relationships exist
    const relationships = await db.select()
      .from(relationshipsTable)
      .where(eq(relationshipsTable.parent_id, parentId))
      .execute();

    expect(relationships).toHaveLength(2);
  });

  it('should allow creating generational relationships', async () => {
    // Create grandparent -> parent relationship
    const grandparentRelation = await createRelationship({
      parent_id: grandparentId,
      child_id: parentId
    });

    // Create parent -> child relationship
    const parentRelation = await createRelationship({
      parent_id: parentId,
      child_id: childId
    });

    // Verify both relationships exist
    expect(grandparentRelation.parent_id).toEqual(grandparentId);
    expect(grandparentRelation.child_id).toEqual(parentId);
    
    expect(parentRelation.parent_id).toEqual(parentId);
    expect(parentRelation.child_id).toEqual(childId);

    const allRelationships = await db.select()
      .from(relationshipsTable)
      .execute();

    expect(allRelationships).toHaveLength(2);
  });
});