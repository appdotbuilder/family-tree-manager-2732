import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { peopleTable, relationshipsTable } from '../db/schema';
import { getFamilyTree } from '../handlers/get_family_tree';

describe('getFamilyTree', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no people exist', async () => {
    const result = await getFamilyTree();
    expect(result).toEqual([]);
  });

  it('should return single person with no relationships', async () => {
    // Create a single person
    const [person] = await db.insert(peopleTable)
      .values({
        full_name: 'John Doe',
        birth_date: new Date('1980-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    const result = await getFamilyTree();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(person.id);
    expect(result[0].full_name).toBe('John Doe');
    expect(result[0].birth_date).toEqual(new Date('1980-01-01'));
    expect(result[0].death_date).toBeNull();
    expect(result[0].photo_url).toBeNull();
    expect(result[0].parents).toEqual([]);
    expect(result[0].children).toEqual([]);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return family tree with parent-child relationships', async () => {
    // Create parent
    const [parent] = await db.insert(peopleTable)
      .values({
        full_name: 'Jane Smith',
        birth_date: new Date('1950-05-15'),
        death_date: null,
        photo_url: 'https://example.com/jane.jpg'
      })
      .returning()
      .execute();

    // Create child
    const [child] = await db.insert(peopleTable)
      .values({
        full_name: 'Tom Smith',
        birth_date: new Date('1980-03-20'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create relationship
    await db.insert(relationshipsTable)
      .values({
        parent_id: parent.id,
        child_id: child.id
      })
      .execute();

    const result = await getFamilyTree();

    expect(result).toHaveLength(2);

    // Find parent in results
    const parentResult = result.find(p => p.id === parent.id);
    expect(parentResult).toBeDefined();
    expect(parentResult!.full_name).toBe('Jane Smith');
    expect(parentResult!.parents).toEqual([]);
    expect(parentResult!.children).toHaveLength(1);
    expect(parentResult!.children[0].id).toBe(child.id);
    expect(parentResult!.children[0].full_name).toBe('Tom Smith');

    // Find child in results
    const childResult = result.find(p => p.id === child.id);
    expect(childResult).toBeDefined();
    expect(childResult!.full_name).toBe('Tom Smith');
    expect(childResult!.children).toEqual([]);
    expect(childResult!.parents).toHaveLength(1);
    expect(childResult!.parents[0].id).toBe(parent.id);
    expect(childResult!.parents[0].full_name).toBe('Jane Smith');
  });

  it('should handle complex multi-generation family tree', async () => {
    // Create grandparent
    const [grandparent] = await db.insert(peopleTable)
      .values({
        full_name: 'Robert Wilson',
        birth_date: new Date('1925-12-01'),
        death_date: new Date('2010-06-15'),
        photo_url: null
      })
      .returning()
      .execute();

    // Create parent 1
    const [parent1] = await db.insert(peopleTable)
      .values({
        full_name: 'Mary Wilson',
        birth_date: new Date('1950-08-10'),
        death_date: null,
        photo_url: 'https://example.com/mary.jpg'
      })
      .returning()
      .execute();

    // Create parent 2
    const [parent2] = await db.insert(peopleTable)
      .values({
        full_name: 'David Wilson',
        birth_date: new Date('1952-11-05'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create grandchild
    const [grandchild] = await db.insert(peopleTable)
      .values({
        full_name: 'Sarah Wilson',
        birth_date: new Date('1985-04-22'),
        death_date: null,
        photo_url: 'https://example.com/sarah.jpg'
      })
      .returning()
      .execute();

    // Create relationships
    await db.insert(relationshipsTable)
      .values([
        { parent_id: grandparent.id, child_id: parent1.id },
        { parent_id: grandparent.id, child_id: parent2.id },
        { parent_id: parent1.id, child_id: grandchild.id }
      ])
      .execute();

    const result = await getFamilyTree();

    expect(result).toHaveLength(4);

    // Check grandparent
    const grandparentResult = result.find(p => p.id === grandparent.id);
    expect(grandparentResult!.parents).toEqual([]);
    expect(grandparentResult!.children).toHaveLength(2);
    expect(grandparentResult!.children.map(c => c.full_name)).toEqual(['Mary Wilson', 'David Wilson']);

    // Check parent1
    const parent1Result = result.find(p => p.id === parent1.id);
    expect(parent1Result!.parents).toHaveLength(1);
    expect(parent1Result!.parents[0].full_name).toBe('Robert Wilson');
    expect(parent1Result!.children).toHaveLength(1);
    expect(parent1Result!.children[0].full_name).toBe('Sarah Wilson');

    // Check parent2
    const parent2Result = result.find(p => p.id === parent2.id);
    expect(parent2Result!.parents).toHaveLength(1);
    expect(parent2Result!.parents[0].full_name).toBe('Robert Wilson');
    expect(parent2Result!.children).toEqual([]);

    // Check grandchild
    const grandchildResult = result.find(p => p.id === grandchild.id);
    expect(grandchildResult!.parents).toHaveLength(1);
    expect(grandchildResult!.parents[0].full_name).toBe('Mary Wilson');
    expect(grandchildResult!.children).toEqual([]);
  });

  it('should handle person with multiple parents (adoption scenario)', async () => {
    // Create biological parent
    const [bioParent] = await db.insert(peopleTable)
      .values({
        full_name: 'Bio Parent',
        birth_date: new Date('1960-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create adoptive parent
    const [adoptiveParent] = await db.insert(peopleTable)
      .values({
        full_name: 'Adoptive Parent',
        birth_date: new Date('1965-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create child
    const [child] = await db.insert(peopleTable)
      .values({
        full_name: 'Child',
        birth_date: new Date('1990-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create relationships
    await db.insert(relationshipsTable)
      .values([
        { parent_id: bioParent.id, child_id: child.id },
        { parent_id: adoptiveParent.id, child_id: child.id }
      ])
      .execute();

    const result = await getFamilyTree();

    expect(result).toHaveLength(3);

    // Check child has both parents
    const childResult = result.find(p => p.id === child.id);
    expect(childResult!.parents).toHaveLength(2);
    expect(childResult!.parents.map(p => p.full_name).sort()).toEqual(['Adoptive Parent', 'Bio Parent']);

    // Check biological parent
    const bioParentResult = result.find(p => p.id === bioParent.id);
    expect(bioParentResult!.children).toHaveLength(1);
    expect(bioParentResult!.children[0].full_name).toBe('Child');

    // Check adoptive parent
    const adoptiveParentResult = result.find(p => p.id === adoptiveParent.id);
    expect(adoptiveParentResult!.children).toHaveLength(1);
    expect(adoptiveParentResult!.children[0].full_name).toBe('Child');
  });

  it('should preserve all person fields including dates and photo URLs', async () => {
    // Create person with all fields filled
    const [person] = await db.insert(peopleTable)
      .values({
        full_name: 'Complete Person',
        birth_date: new Date('1975-07-15'),
        death_date: new Date('2020-12-25'),
        photo_url: 'https://example.com/complete.jpg'
      })
      .returning()
      .execute();

    const result = await getFamilyTree();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe('Complete Person');
    expect(result[0].birth_date).toEqual(new Date('1975-07-15'));
    expect(result[0].death_date).toEqual(new Date('2020-12-25'));
    expect(result[0].photo_url).toBe('https://example.com/complete.jpg');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});