import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { peopleTable } from '../db/schema';
import { type CreatePersonInput } from '../schema';
import { createPerson } from '../handlers/create_person';
import { eq } from 'drizzle-orm';

// Test input with all fields
const fullTestInput: CreatePersonInput = {
  full_name: 'John Doe',
  birth_date: new Date('1980-05-15'),
  death_date: null,
  photo_url: 'https://example.com/photo.jpg'
};

// Test input with minimal required fields
const minimalTestInput: CreatePersonInput = {
  full_name: 'Jane Smith',
  birth_date: null,
  death_date: null,
  photo_url: null
};

// Test input with person who has passed away
const deceasedTestInput: CreatePersonInput = {
  full_name: 'Albert Einstein',
  birth_date: new Date('1879-03-14'),
  death_date: new Date('1955-04-18'),
  photo_url: 'https://example.com/einstein.jpg'
};

describe('createPerson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a person with all fields', async () => {
    const result = await createPerson(fullTestInput);

    // Basic field validation
    expect(result.full_name).toEqual('John Doe');
    expect(result.birth_date).toEqual(new Date('1980-05-15'));
    expect(result.death_date).toBeNull();
    expect(result.photo_url).toEqual('https://example.com/photo.jpg');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a person with minimal required fields', async () => {
    const result = await createPerson(minimalTestInput);

    // Basic field validation
    expect(result.full_name).toEqual('Jane Smith');
    expect(result.birth_date).toBeNull();
    expect(result.death_date).toBeNull();
    expect(result.photo_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a deceased person with birth and death dates', async () => {
    const result = await createPerson(deceasedTestInput);

    // Basic field validation
    expect(result.full_name).toEqual('Albert Einstein');
    expect(result.birth_date).toEqual(new Date('1879-03-14'));
    expect(result.death_date).toEqual(new Date('1955-04-18'));
    expect(result.photo_url).toEqual('https://example.com/einstein.jpg');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save person to database', async () => {
    const result = await createPerson(fullTestInput);

    // Query using proper drizzle syntax
    const people = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, result.id))
      .execute();

    expect(people).toHaveLength(1);
    const savedPerson = people[0];
    expect(savedPerson.full_name).toEqual('John Doe');
    expect(savedPerson.birth_date).toEqual(new Date('1980-05-15'));
    expect(savedPerson.death_date).toBeNull();
    expect(savedPerson.photo_url).toEqual('https://example.com/photo.jpg');
    expect(savedPerson.created_at).toBeInstanceOf(Date);
    expect(savedPerson.updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple people', async () => {
    const person1 = await createPerson({
      full_name: 'Person One',
      birth_date: null,
      death_date: null,
      photo_url: null
    });

    const person2 = await createPerson({
      full_name: 'Person Two',
      birth_date: null,
      death_date: null,
      photo_url: null
    });

    expect(person1.id).not.toEqual(person2.id);
    expect(person1.id).toBeGreaterThan(0);
    expect(person2.id).toBeGreaterThan(0);
    expect(person2.id).toBeGreaterThan(person1.id);
  });

  it('should handle date objects correctly', async () => {
    const birthDate = new Date('1990-12-25');
    const deathDate = new Date('2020-01-01');
    
    const testInput: CreatePersonInput = {
      full_name: 'Date Test Person',
      birth_date: birthDate,
      death_date: deathDate,
      photo_url: null
    };

    const result = await createPerson(testInput);

    expect(result.birth_date).toBeInstanceOf(Date);
    expect(result.death_date).toBeInstanceOf(Date);
    expect(result.birth_date?.getTime()).toEqual(birthDate.getTime());
    expect(result.death_date?.getTime()).toEqual(deathDate.getTime());
  });

  it('should set timestamps automatically', async () => {
    const beforeCreate = new Date();
    const result = await createPerson(minimalTestInput);
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});