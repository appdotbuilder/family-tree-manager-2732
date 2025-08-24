import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { peopleTable, relationshipsTable } from '../db/schema';
import { type GetPersonInput } from '../schema';
import { getPerson } from '../handlers/get_person';
import { eq } from 'drizzle-orm';

describe('getPerson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent person', async () => {
    const input: GetPersonInput = { id: 999 };
    const result = await getPerson(input);

    expect(result).toBeNull();
  });

  it('should get person without relationships', async () => {
    // Create a person
    const personResult = await db.insert(peopleTable)
      .values({
        full_name: 'John Doe',
        birth_date: new Date('1980-01-01'),
        death_date: null,
        photo_url: 'https://example.com/john.jpg'
      })
      .returning()
      .execute();

    const person = personResult[0];
    const input: GetPersonInput = { id: person.id };
    const result = await getPerson(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(person.id);
    expect(result!.full_name).toBe('John Doe');
    expect(result!.birth_date).toEqual(new Date('1980-01-01'));
    expect(result!.death_date).toBeNull();
    expect(result!.photo_url).toBe('https://example.com/john.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.parents).toHaveLength(0);
    expect(result!.children).toHaveLength(0);
  });

  it('should get person with parents', async () => {
    // Create parent
    const parentResult = await db.insert(peopleTable)
      .values({
        full_name: 'Jane Parent',
        birth_date: new Date('1950-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create child
    const childResult = await db.insert(peopleTable)
      .values({
        full_name: 'John Child',
        birth_date: new Date('1980-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create relationship
    await db.insert(relationshipsTable)
      .values({
        parent_id: parentResult[0].id,
        child_id: childResult[0].id
      })
      .execute();

    const input: GetPersonInput = { id: childResult[0].id };
    const result = await getPerson(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(childResult[0].id);
    expect(result!.full_name).toBe('John Child');
    expect(result!.parents).toHaveLength(1);
    expect(result!.parents[0].id).toBe(parentResult[0].id);
    expect(result!.parents[0].full_name).toBe('Jane Parent');
    expect(result!.children).toHaveLength(0);
  });

  it('should get person with children', async () => {
    // Create parent
    const parentResult = await db.insert(peopleTable)
      .values({
        full_name: 'Jane Parent',
        birth_date: new Date('1950-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create child
    const childResult = await db.insert(peopleTable)
      .values({
        full_name: 'John Child',
        birth_date: new Date('1980-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create relationship
    await db.insert(relationshipsTable)
      .values({
        parent_id: parentResult[0].id,
        child_id: childResult[0].id
      })
      .execute();

    const input: GetPersonInput = { id: parentResult[0].id };
    const result = await getPerson(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(parentResult[0].id);
    expect(result!.full_name).toBe('Jane Parent');
    expect(result!.parents).toHaveLength(0);
    expect(result!.children).toHaveLength(1);
    expect(result!.children[0].id).toBe(childResult[0].id);
    expect(result!.children[0].full_name).toBe('John Child');
  });

  it('should get person with multiple parents and children', async () => {
    // Create first parent
    const parent1Result = await db.insert(peopleTable)
      .values({
        full_name: 'Mother',
        birth_date: new Date('1950-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create second parent
    const parent2Result = await db.insert(peopleTable)
      .values({
        full_name: 'Father',
        birth_date: new Date('1948-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create target person
    const personResult = await db.insert(peopleTable)
      .values({
        full_name: 'Target Person',
        birth_date: new Date('1980-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create first child
    const child1Result = await db.insert(peopleTable)
      .values({
        full_name: 'First Child',
        birth_date: new Date('2000-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create second child
    const child2Result = await db.insert(peopleTable)
      .values({
        full_name: 'Second Child',
        birth_date: new Date('2002-01-01'),
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create parent relationships
    await db.insert(relationshipsTable)
      .values([
        { parent_id: parent1Result[0].id, child_id: personResult[0].id },
        { parent_id: parent2Result[0].id, child_id: personResult[0].id }
      ])
      .execute();

    // Create child relationships
    await db.insert(relationshipsTable)
      .values([
        { parent_id: personResult[0].id, child_id: child1Result[0].id },
        { parent_id: personResult[0].id, child_id: child2Result[0].id }
      ])
      .execute();

    const input: GetPersonInput = { id: personResult[0].id };
    const result = await getPerson(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(personResult[0].id);
    expect(result!.full_name).toBe('Target Person');
    
    // Check parents
    expect(result!.parents).toHaveLength(2);
    const parentNames = result!.parents.map(p => p.full_name).sort();
    expect(parentNames).toEqual(['Father', 'Mother']);
    
    // Check children
    expect(result!.children).toHaveLength(2);
    const childNames = result!.children.map(c => c.full_name).sort();
    expect(childNames).toEqual(['First Child', 'Second Child']);
  });

  it('should handle person with nullable dates and photo_url', async () => {
    // Create person with all nullable fields as null
    const personResult = await db.insert(peopleTable)
      .values({
        full_name: 'Minimal Person',
        birth_date: null,
        death_date: null,
        photo_url: null
      })
      .returning()
      .execute();

    const input: GetPersonInput = { id: personResult[0].id };
    const result = await getPerson(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(personResult[0].id);
    expect(result!.full_name).toBe('Minimal Person');
    expect(result!.birth_date).toBeNull();
    expect(result!.death_date).toBeNull();
    expect(result!.photo_url).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should verify person exists in database after retrieval', async () => {
    // Create person
    const personResult = await db.insert(peopleTable)
      .values({
        full_name: 'Database Test Person',
        birth_date: new Date('1975-06-15'),
        death_date: new Date('2020-12-31'),
        photo_url: 'https://example.com/test.jpg'
      })
      .returning()
      .execute();

    const person = personResult[0];
    const input: GetPersonInput = { id: person.id };
    const result = await getPerson(input);

    // Verify the person exists in database
    const dbPerson = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, person.id))
      .execute();

    expect(dbPerson).toHaveLength(1);
    expect(dbPerson[0].full_name).toBe('Database Test Person');
    expect(dbPerson[0].birth_date).toEqual(new Date('1975-06-15'));
    expect(dbPerson[0].death_date).toEqual(new Date('2020-12-31'));

    // Verify handler result matches database
    expect(result!.id).toBe(dbPerson[0].id);
    expect(result!.full_name).toBe(dbPerson[0].full_name);
    expect(result!.birth_date).toEqual(dbPerson[0].birth_date);
    expect(result!.death_date).toEqual(dbPerson[0].death_date);
    expect(result!.photo_url).toBe(dbPerson[0].photo_url);
  });
});