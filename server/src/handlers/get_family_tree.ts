import { db } from '../db';
import { peopleTable, relationshipsTable } from '../db/schema';
import { type PersonWithRelationships } from '../schema';
import { eq } from 'drizzle-orm';

export async function getFamilyTree(): Promise<PersonWithRelationships[]> {
  try {
    // Get all people from the database
    const allPeople = await db.select()
      .from(peopleTable)
      .execute();

    // Get all relationships
    const allRelationships = await db.select()
      .from(relationshipsTable)
      .execute();

    // Transform each person to include their relationships
    const familyTree = allPeople.map(person => {
      // Find all relationships where this person is a parent
      const childRelationships = allRelationships.filter(rel => rel.parent_id === person.id);
      
      // Find all relationships where this person is a child
      const parentRelationships = allRelationships.filter(rel => rel.child_id === person.id);
      
      // Get the actual person objects for children
      const children = childRelationships.map(rel => {
        const child = allPeople.find(p => p.id === rel.child_id);
        if (!child) {
          throw new Error(`Child with id ${rel.child_id} not found`);
        }
        return child;
      });
      
      // Get the actual person objects for parents
      const parents = parentRelationships.map(rel => {
        const parent = allPeople.find(p => p.id === rel.parent_id);
        if (!parent) {
          throw new Error(`Parent with id ${rel.parent_id} not found`);
        }
        return parent;
      });

      return {
        ...person,
        parents,
        children
      };
    });

    return familyTree;
  } catch (error) {
    console.error('Failed to fetch family tree:', error);
    throw error;
  }
}