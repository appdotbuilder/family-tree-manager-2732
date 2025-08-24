import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { peopleTable } from '../db/schema';
import { type UpdatePersonInput, type CreatePersonInput } from '../schema';
import { updatePerson } from '../handlers/update_person';
import { eq } from 'drizzle-orm';

// Test data
const createPersonInput: CreatePersonInput = {
  full_name: 'John Doe',
  birth_date: new Date('1980-01-01'),
  death_date: null,
  photo_url: 'https://example.com/photo.jpg'
};

describe('updatePerson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a person with all fields', async () => {
    // First create a person
    const createdPerson = await db.insert(peopleTable)
      .values({
        full_name: createPersonInput.full_name,
        birth_date: createPersonInput.birth_date,
        death_date: createPersonInput.death_date,
        photo_url: createPersonInput.photo_url
      })
      .returning()
      .execute();

    const personId = createdPerson[0].id;

    // Update all fields
    const updateInput: UpdatePersonInput = {
      id: personId,
      full_name: 'Jane Smith',
      birth_date: new Date('1985-06-15'),
      death_date: new Date('2020-12-31'),
      photo_url: 'https://example.com/new-photo.jpg'
    };

    const result = await updatePerson(updateInput);

    // Verify updated fields
    expect(result.id).toBe(personId);
    expect(result.full_name).toBe('Jane Smith');
    expect(result.birth_date).toEqual(new Date('1985-06-15'));
    expect(result.death_date).toEqual(new Date('2020-12-31'));
    expect(result.photo_url).toBe('https://example.com/new-photo.jpg');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields (partial update)', async () => {
    // First create a person
    const createdPerson = await db.insert(peopleTable)
      .values({
        full_name: createPersonInput.full_name,
        birth_date: createPersonInput.birth_date,
        death_date: createPersonInput.death_date,
        photo_url: createPersonInput.photo_url
      })
      .returning()
      .execute();

    const personId = createdPerson[0].id;
    const originalCreatedAt = createdPerson[0].created_at;

    // Update only name
    const updateInput: UpdatePersonInput = {
      id: personId,
      full_name: 'Updated Name'
    };

    const result = await updatePerson(updateInput);

    // Verify only name was updated, other fields unchanged
    expect(result.id).toBe(personId);
    expect(result.full_name).toBe('Updated Name');
    expect(result.birth_date).toEqual(createPersonInput.birth_date);
    expect(result.death_date).toBe(createPersonInput.death_date);
    expect(result.photo_url).toBe(createPersonInput.photo_url);
    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalCreatedAt).toBe(true);
  });

  it('should update nullable fields to null', async () => {
    // First create a person with values
    const createdPerson = await db.insert(peopleTable)
      .values({
        full_name: createPersonInput.full_name,
        birth_date: createPersonInput.birth_date,
        death_date: null,
        photo_url: createPersonInput.photo_url
      })
      .returning()
      .execute();

    const personId = createdPerson[0].id;

    // Update nullable fields to null
    const updateInput: UpdatePersonInput = {
      id: personId,
      birth_date: null,
      photo_url: null
    };

    const result = await updatePerson(updateInput);

    // Verify nullable fields were set to null
    expect(result.id).toBe(personId);
    expect(result.full_name).toBe(createPersonInput.full_name); // Unchanged
    expect(result.birth_date).toBeNull();
    expect(result.death_date).toBeNull();
    expect(result.photo_url).toBeNull();
  });

  it('should persist changes to database', async () => {
    // First create a person
    const createdPerson = await db.insert(peopleTable)
      .values({
        full_name: createPersonInput.full_name,
        birth_date: createPersonInput.birth_date,
        death_date: createPersonInput.death_date,
        photo_url: createPersonInput.photo_url
      })
      .returning()
      .execute();

    const personId = createdPerson[0].id;

    // Update the person
    const updateInput: UpdatePersonInput = {
      id: personId,
      full_name: 'Database Test Name',
      birth_date: new Date('1990-03-20')
    };

    await updatePerson(updateInput);

    // Query database directly to verify changes persisted
    const updatedPersonFromDb = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, personId))
      .execute();

    expect(updatedPersonFromDb).toHaveLength(1);
    expect(updatedPersonFromDb[0].full_name).toBe('Database Test Name');
    expect(updatedPersonFromDb[0].birth_date).toEqual(new Date('1990-03-20'));
    expect(updatedPersonFromDb[0].photo_url).toBe(createPersonInput.photo_url); // Unchanged
  });

  it('should throw error for non-existent person', async () => {
    const updateInput: UpdatePersonInput = {
      id: 999999, // Non-existent ID
      full_name: 'Should Fail'
    };

    await expect(updatePerson(updateInput)).rejects.toThrow(/Person with id 999999 not found/i);
  });

  it('should update timestamps correctly', async () => {
    // First create a person
    const createdPerson = await db.insert(peopleTable)
      .values({
        full_name: createPersonInput.full_name,
        birth_date: createPersonInput.birth_date,
        death_date: createPersonInput.death_date,
        photo_url: createPersonInput.photo_url
      })
      .returning()
      .execute();

    const personId = createdPerson[0].id;
    const originalCreatedAt = createdPerson[0].created_at;
    const originalUpdatedAt = createdPerson[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the person
    const updateInput: UpdatePersonInput = {
      id: personId,
      full_name: 'Timestamp Test'
    };

    const result = await updatePerson(updateInput);

    // Verify timestamps
    expect(result.created_at).toEqual(originalCreatedAt); // Should not change
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true); // Should be updated
  });
});