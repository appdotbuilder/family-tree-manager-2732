import { db } from '../db';
import { relationshipsTable } from '../db/schema';
import { type DeleteRelationshipInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteRelationship(input: DeleteRelationshipInput): Promise<{ success: boolean }> {
  try {
    // Delete the specific relationship record
    const result = await db.delete(relationshipsTable)
      .where(
        and(
          eq(relationshipsTable.parent_id, input.parent_id),
          eq(relationshipsTable.child_id, input.child_id)
        )
      )
      .execute();

    // Check if any rows were affected (relationship existed and was deleted)
    const success = result.rowCount !== null && result.rowCount > 0;

    return { success };
  } catch (error) {
    console.error('Relationship deletion failed:', error);
    throw error;
  }
}