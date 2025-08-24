import { db } from '../db';
import { peopleTable } from '../db/schema';
import { type GetPersonInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deletePerson = async (input: GetPersonInput): Promise<{ success: boolean }> => {
  try {
    // Check if person exists first
    const existingPerson = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, input.id))
      .execute();

    if (existingPerson.length === 0) {
      throw new Error(`Person with id ${input.id} not found`);
    }

    // Delete the person - relationships will be cascade deleted automatically
    // due to foreign key constraints with onDelete: 'cascade'
    const result = await db.delete(peopleTable)
      .where(eq(peopleTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Person deletion failed:', error);
    throw error;
  }
};