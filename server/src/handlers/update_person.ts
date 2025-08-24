import { db } from '../db';
import { peopleTable } from '../db/schema';
import { type UpdatePersonInput, type Person } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePerson = async (input: UpdatePersonInput): Promise<Person> => {
  try {
    // Verify person exists before updating
    const existingPerson = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, input.id))
      .execute();

    if (existingPerson.length === 0) {
      throw new Error(`Person with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof peopleTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name;
    }
    if (input.birth_date !== undefined) {
      updateData.birth_date = input.birth_date;
    }
    if (input.death_date !== undefined) {
      updateData.death_date = input.death_date;
    }
    if (input.photo_url !== undefined) {
      updateData.photo_url = input.photo_url;
    }

    // Update the person record
    const result = await db.update(peopleTable)
      .set(updateData)
      .where(eq(peopleTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Person update failed:', error);
    throw error;
  }
};