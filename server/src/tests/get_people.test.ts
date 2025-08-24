import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { peopleTable } from '../db/schema';
import { getPeople } from '../handlers/get_people';

describe('getPeople', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no people exist', async () => {
    const result = await getPeople();
    
    expect(result).toEqual([]);
  });

  it('should return all people from database', async () => {
    // Create test people
    const testPeople = [
      {
        full_name: 'John Doe',
        birth_date: new Date('1980-01-15'),
        death_date: null,
        photo_url: 'https://example.com/john.jpg'
      },
      {
        full_name: 'Jane Smith',
        birth_date: new Date('1985-05-20'),
        death_date: new Date('2020-12-10'),
        photo_url: null
      },
      {
        full_name: 'Bob Johnson',
        birth_date: null,
        death_date: null,
        photo_url: 'https://example.com/bob.jpg'
      }
    ];

    // Insert test data
    await db.insert(peopleTable)
      .values(testPeople)
      .execute();

    const result = await getPeople();

    // Should return all 3 people
    expect(result).toHaveLength(3);

    // Verify all expected fields are present
    result.forEach(person => {
      expect(person.id).toBeDefined();
      expect(typeof person.id).toBe('number');
      expect(person.full_name).toBeDefined();
      expect(typeof person.full_name).toBe('string');
      expect(person.created_at).toBeInstanceOf(Date);
      expect(person.updated_at).toBeInstanceOf(Date);
      
      // Optional fields can be Date or null
      if (person.birth_date !== null) {
        expect(person.birth_date).toBeInstanceOf(Date);
      }
      if (person.death_date !== null) {
        expect(person.death_date).toBeInstanceOf(Date);
      }
    });

    // Check specific people data
    const johnDoe = result.find(p => p.full_name === 'John Doe');
    expect(johnDoe).toBeDefined();
    expect(johnDoe!.birth_date).toBeInstanceOf(Date);
    expect(johnDoe!.birth_date!.getFullYear()).toBe(1980);
    expect(johnDoe!.death_date).toBeNull();
    expect(johnDoe!.photo_url).toBe('https://example.com/john.jpg');

    const janeSmith = result.find(p => p.full_name === 'Jane Smith');
    expect(janeSmith).toBeDefined();
    expect(janeSmith!.birth_date).toBeInstanceOf(Date);
    expect(janeSmith!.death_date).toBeInstanceOf(Date);
    expect(janeSmith!.death_date!.getFullYear()).toBe(2020);
    expect(janeSmith!.photo_url).toBeNull();

    const bobJohnson = result.find(p => p.full_name === 'Bob Johnson');
    expect(bobJohnson).toBeDefined();
    expect(bobJohnson!.birth_date).toBeNull();
    expect(bobJohnson!.death_date).toBeNull();
    expect(bobJohnson!.photo_url).toBe('https://example.com/bob.jpg');
  });

  it('should return people in consistent order', async () => {
    // Create test people
    const testPeople = [
      { full_name: 'Alice Wilson', birth_date: new Date('1990-03-12'), death_date: null, photo_url: null },
      { full_name: 'Charlie Brown', birth_date: new Date('1975-08-25'), death_date: null, photo_url: null },
      { full_name: 'Diana Prince', birth_date: new Date('1995-11-30'), death_date: null, photo_url: null }
    ];

    await db.insert(peopleTable)
      .values(testPeople)
      .execute();

    // Call multiple times to ensure consistent ordering
    const result1 = await getPeople();
    const result2 = await getPeople();

    expect(result1).toHaveLength(3);
    expect(result2).toHaveLength(3);

    // Results should be in same order (by id, which is serial/auto-increment)
    for (let i = 0; i < result1.length; i++) {
      expect(result1[i].id).toBe(result2[i].id);
      expect(result1[i].full_name).toBe(result2[i].full_name);
    }
  });

  it('should handle people with all nullable fields as null', async () => {
    // Create person with minimal required data only
    await db.insert(peopleTable)
      .values({
        full_name: 'Minimal Person',
        birth_date: null,
        death_date: null,
        photo_url: null
      })
      .execute();

    const result = await getPeople();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe('Minimal Person');
    expect(result[0].birth_date).toBeNull();
    expect(result[0].death_date).toBeNull();
    expect(result[0].photo_url).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle large dataset efficiently', async () => {
    // Create 50 test people
    const largeBatch = Array.from({ length: 50 }, (_, i) => ({
      full_name: `Person ${i + 1}`,
      birth_date: new Date(1950 + i, 0, 1),
      death_date: i % 5 === 0 ? new Date(2000 + i, 0, 1) : null, // Every 5th person is deceased
      photo_url: i % 3 === 0 ? `https://example.com/person${i + 1}.jpg` : null // Every 3rd person has photo
    }));

    await db.insert(peopleTable)
      .values(largeBatch)
      .execute();

    const result = await getPeople();

    expect(result).toHaveLength(50);

    // Verify all people have proper data types
    result.forEach((person, index) => {
      expect(person.full_name).toBe(`Person ${index + 1}`);
      expect(person.birth_date).toBeInstanceOf(Date);
      expect(person.created_at).toBeInstanceOf(Date);
      expect(person.updated_at).toBeInstanceOf(Date);
    });

    // Check that deceased people have death dates
    const deceasedPeople = result.filter(p => p.death_date !== null);
    expect(deceasedPeople.length).toBe(10); // Every 5th person = 50/5 = 10

    // Check that people with photos have photo URLs
    const peopleWithPhotos = result.filter(p => p.photo_url !== null);
    expect(peopleWithPhotos.length).toBeGreaterThan(10); // Every 3rd person
  });
});