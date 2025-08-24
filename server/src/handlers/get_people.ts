import { db } from '../db';
import { peopleTable } from '../db/schema';
import { type Person } from '../schema';

export const getPeople = async (): Promise<Person[]> => {
  try {
    // Fetch all people from the database
    const results = await db.select()
      .from(peopleTable)
      .execute();

    // Return the results as-is since all fields are already the correct types
    // (timestamp columns are automatically converted to Date objects by Drizzle)
    return results;
  } catch (error) {
    console.error('Failed to fetch people:', error);
    throw error;
  }
};