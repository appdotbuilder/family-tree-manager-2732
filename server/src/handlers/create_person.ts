import { db } from '../db';
import { peopleTable } from '../db/schema';
import { type CreatePersonInput, type Person } from '../schema';

export const createPerson = async (input: CreatePersonInput): Promise<Person> => {
  try {
    // Insert person record
    const result = await db.insert(peopleTable)
      .values({
        full_name: input.full_name,
        birth_date: input.birth_date,
        death_date: input.death_date,
        photo_url: input.photo_url
      })
      .returning()
      .execute();

    // Return the created person
    const person = result[0];
    return person;
  } catch (error) {
    console.error('Person creation failed:', error);
    throw error;
  }
};