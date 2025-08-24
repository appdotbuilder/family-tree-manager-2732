import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { peopleTable, relationshipsTable } from '../db/schema';
import { type GetPersonInput } from '../schema';
import { deletePerson } from '../handlers/delete_person';
import { eq } from 'drizzle-orm';

describe('deletePerson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a person successfully', async () => {
    // Create a test person
    const personResult = await db.insert(peopleTable)
      .values({
        full_name: 'John Doe',
        birth_date: new Date('1980-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    const personId = personResult[0].id;

    const input: GetPersonInput = {
      id: personId
    };

    // Delete the person
    const result = await deletePerson(input);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify person is deleted from database
    const deletedPerson = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, personId))
      .execute();

    expect(deletedPerson).toHaveLength(0);
  });

  it('should cascade delete relationships when person is deleted', async () => {
    // Create parent and child
    const parentResult = await db.insert(peopleTable)
      .values({
        full_name: 'Parent Person',
        birth_date: new Date('1950-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    const childResult = await db.insert(peopleTable)
      .values({
        full_name: 'Child Person',
        birth_date: new Date('1980-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    const parentId = parentResult[0].id;
    const childId = childResult[0].id;

    // Create relationship
    await db.insert(relationshipsTable)
      .values({
        parent_id: parentId,
        child_id: childId
      })
      .execute();

    // Verify relationship exists
    const relationshipsBefore = await db.select()
      .from(relationshipsTable)
      .where(eq(relationshipsTable.parent_id, parentId))
      .execute();

    expect(relationshipsBefore).toHaveLength(1);

    const input: GetPersonInput = {
      id: parentId
    };

    // Delete the parent
    const result = await deletePerson(input);

    expect(result.success).toBe(true);

    // Verify parent is deleted
    const deletedParent = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, parentId))
      .execute();

    expect(deletedParent).toHaveLength(0);

    // Verify relationships are cascade deleted
    const relationshipsAfter = await db.select()
      .from(relationshipsTable)
      .where(eq(relationshipsTable.parent_id, parentId))
      .execute();

    expect(relationshipsAfter).toHaveLength(0);

    // Verify child still exists (only relationship deleted, not the child person)
    const remainingChild = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, childId))
      .execute();

    expect(remainingChild).toHaveLength(1);
    expect(remainingChild[0].full_name).toBe('Child Person');
  });

  it('should cascade delete multiple relationships', async () => {
    // Create one parent and two children
    const parentResult = await db.insert(peopleTable)
      .values({
        full_name: 'Parent Person',
        birth_date: new Date('1950-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    const child1Result = await db.insert(peopleTable)
      .values({
        full_name: 'Child One',
        birth_date: new Date('1980-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    const child2Result = await db.insert(peopleTable)
      .values({
        full_name: 'Child Two',
        birth_date: new Date('1985-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    const parentId = parentResult[0].id;
    const child1Id = child1Result[0].id;
    const child2Id = child2Result[0].id;

    // Create multiple relationships
    await db.insert(relationshipsTable)
      .values([
        { parent_id: parentId, child_id: child1Id },
        { parent_id: parentId, child_id: child2Id }
      ])
      .execute();

    // Verify relationships exist
    const relationshipsBefore = await db.select()
      .from(relationshipsTable)
      .where(eq(relationshipsTable.parent_id, parentId))
      .execute();

    expect(relationshipsBefore).toHaveLength(2);

    const input: GetPersonInput = {
      id: parentId
    };

    // Delete the parent
    const result = await deletePerson(input);

    expect(result.success).toBe(true);

    // Verify all relationships with this parent are deleted
    const relationshipsAfter = await db.select()
      .from(relationshipsTable)
      .where(eq(relationshipsTable.parent_id, parentId))
      .execute();

    expect(relationshipsAfter).toHaveLength(0);

    // Verify both children still exist
    const remainingChildren = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, child1Id))
      .execute();

    expect(remainingChildren).toHaveLength(1);

    const remainingChildren2 = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, child2Id))
      .execute();

    expect(remainingChildren2).toHaveLength(1);
  });

  it('should throw error when person does not exist', async () => {
    const input: GetPersonInput = {
      id: 99999 // Non-existent ID
    };

    await expect(deletePerson(input)).rejects.toThrow(/person with id 99999 not found/i);
  });

  it('should handle person with no relationships', async () => {
    // Create a person with no relationships
    const personResult = await db.insert(peopleTable)
      .values({
        full_name: 'Isolated Person',
        birth_date: new Date('1990-01-01'),
        death_date: null,
        photo_url: 'https://example.com/photo.jpg'
      })
      .returning()
      .execute();

    const personId = personResult[0].id;

    const input: GetPersonInput = {
      id: personId
    };

    // Delete the person
    const result = await deletePerson(input);

    expect(result.success).toBe(true);

    // Verify person is deleted
    const deletedPerson = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, personId))
      .execute();

    expect(deletedPerson).toHaveLength(0);
  });

  it('should delete person who is both parent and child in different relationships', async () => {
    // Create grandparent, parent, and child
    const grandparentResult = await db.insert(peopleTable)
      .values({
        full_name: 'Grandparent',
        birth_date: new Date('1930-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    const parentResult = await db.insert(peopleTable)
      .values({
        full_name: 'Middle Generation',
        birth_date: new Date('1955-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    const childResult = await db.insert(peopleTable)
      .values({
        full_name: 'Youngest Generation',
        birth_date: new Date('1985-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    const grandparentId = grandparentResult[0].id;
    const parentId = parentResult[0].id;
    const childId = childResult[0].id;

    // Create relationships - parent is both child and parent
    await db.insert(relationshipsTable)
      .values([
        { parent_id: grandparentId, child_id: parentId },
        { parent_id: parentId, child_id: childId }
      ])
      .execute();

    // Verify relationships exist
    const allRelationshipsBefore = await db.select()
      .from(relationshipsTable)
      .execute();

    expect(allRelationshipsBefore).toHaveLength(2);

    const input: GetPersonInput = {
      id: parentId
    };

    // Delete the middle generation person
    const result = await deletePerson(input);

    expect(result.success).toBe(true);

    // Verify person is deleted
    const deletedPerson = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, parentId))
      .execute();

    expect(deletedPerson).toHaveLength(0);

    // Verify both relationships involving this person are deleted
    const allRelationshipsAfter = await db.select()
      .from(relationshipsTable)
      .execute();

    expect(allRelationshipsAfter).toHaveLength(0);

    // Verify grandparent and child still exist
    const remainingGrandparent = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, grandparentId))
      .execute();

    const remainingChild = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, childId))
      .execute();

    expect(remainingGrandparent).toHaveLength(1);
    expect(remainingChild).toHaveLength(1);
  });
});