import { db } from '../db';
import { peopleTable, relationshipsTable } from '../db/schema';
import { type GetPersonInput, type PersonWithRelationships, type Person } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPerson(input: GetPersonInput): Promise<PersonWithRelationships | null> {
  try {
    // First, get the person by ID
    const personResult = await db.select()
      .from(peopleTable)
      .where(eq(peopleTable.id, input.id))
      .execute();

    if (personResult.length === 0) {
      return null;
    }

    const person = personResult[0];

    // Get parents by finding relationships where this person is the child
    const parentResults = await db.select({
      id: peopleTable.id,
      full_name: peopleTable.full_name,
      birth_date: peopleTable.birth_date,
      death_date: peopleTable.death_date,
      photo_url: peopleTable.photo_url,
      created_at: peopleTable.created_at,
      updated_at: peopleTable.updated_at
    })
      .from(peopleTable)
      .innerJoin(relationshipsTable, eq(peopleTable.id, relationshipsTable.parent_id))
      .where(eq(relationshipsTable.child_id, input.id))
      .execute();

    // Get children by finding relationships where this person is the parent
    const childResults = await db.select({
      id: peopleTable.id,
      full_name: peopleTable.full_name,
      birth_date: peopleTable.birth_date,
      death_date: peopleTable.death_date,
      photo_url: peopleTable.photo_url,
      created_at: peopleTable.created_at,
      updated_at: peopleTable.updated_at
    })
      .from(peopleTable)
      .innerJoin(relationshipsTable, eq(peopleTable.id, relationshipsTable.child_id))
      .where(eq(relationshipsTable.parent_id, input.id))
      .execute();

    // Convert results to Person arrays
    const parents: Person[] = parentResults.map(result => ({
      id: result.id,
      full_name: result.full_name,
      birth_date: result.birth_date,
      death_date: result.death_date,
      photo_url: result.photo_url,
      created_at: result.created_at,
      updated_at: result.updated_at
    }));

    const children: Person[] = childResults.map(result => ({
      id: result.id,
      full_name: result.full_name,
      birth_date: result.birth_date,
      death_date: result.death_date,
      photo_url: result.photo_url,
      created_at: result.created_at,
      updated_at: result.updated_at
    }));

    // Return the complete PersonWithRelationships object
    return {
      id: person.id,
      full_name: person.full_name,
      birth_date: person.birth_date,
      death_date: person.death_date,
      photo_url: person.photo_url,
      created_at: person.created_at,
      updated_at: person.updated_at,
      parents,
      children
    };
  } catch (error) {
    console.error('Failed to get person:', error);
    throw error;
  }
}