import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Trash2, Heart, Baby } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Person, CreateRelationshipInput, DeleteRelationshipInput } from '../../../server/src/schema';

interface RelationshipManagerProps {
  people: Person[];
  onChange: () => void;
}

export function RelationshipManager({ people, onChange }: RelationshipManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [deleteParent, setDeleteParent] = useState<string>('');
  const [deleteChild, setDeleteChild] = useState<string>('');

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedParent || !selectedChild) {
      return;
    }

    if (selectedParent === selectedChild) {
      alert('A person cannot be their own parent!');
      return;
    }

    setIsCreating(true);
    try {
      const relationshipData: CreateRelationshipInput = {
        parent_id: parseInt(selectedParent),
        child_id: parseInt(selectedChild)
      };
      
      await trpc.createRelationship.mutate(relationshipData);
      
      // Reset form
      setSelectedParent('');
      setSelectedChild('');
      
      // Notify parent component to refresh data
      onChange();
    } catch (error) {
      console.error('Failed to create relationship:', error);
      alert('Failed to create relationship. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deleteParent || !deleteChild) {
      return;
    }

    setIsDeleting(true);
    try {
      const deleteData: DeleteRelationshipInput = {
        parent_id: parseInt(deleteParent),
        child_id: parseInt(deleteChild)
      };
      
      await trpc.deleteRelationship.mutate(deleteData);
      
      // Reset form
      setDeleteParent('');
      setDeleteChild('');
      
      // Notify parent component to refresh data
      onChange();
    } catch (error) {
      console.error('Failed to delete relationship:', error);
      alert('Failed to delete relationship. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getPersonName = (personId: string): string => {
    const person = people.find((p: Person) => p.id.toString() === personId);
    return person?.full_name || 'Unknown';
  };

  if (people.length < 2) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Need More Family Members</h3>
        <p className="text-gray-500 mb-4">
          You need at least 2 family members to create relationships.
        </p>
        <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg inline-block">
          💡 <strong>Tip:</strong> Add more people in the "People" tab first, then come back here to connect them!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Relationship */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Plus className="h-5 w-5" />
            Create New Relationship
          </CardTitle>
          <CardDescription>
            Establish parent-child relationships between family members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRelationship} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parent-select" className="flex items-center gap-1 mb-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Parent
                </Label>
                <Select value={selectedParent} onValueChange={setSelectedParent}>
                  <SelectTrigger id="parent-select">
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person: Person) => (
                      <SelectItem key={`parent-${person.id}`} value={person.id.toString()}>
                        {person.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="child-select" className="flex items-center gap-1 mb-2">
                  <Baby className="h-4 w-4 text-blue-500" />
                  Child
                </Label>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger id="child-select">
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person: Person) => (
                      <SelectItem 
                        key={`child-${person.id}`} 
                        value={person.id.toString()}
                        disabled={selectedParent === person.id.toString()}
                      >
                        {person.full_name}
                        {selectedParent === person.id.toString() && ' (same as parent)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedParent && selectedChild && selectedParent !== selectedChild && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">
                  <strong>Creating:</strong> {getPersonName(selectedParent)} → {getPersonName(selectedChild)}
                  <br />
                  <span className="text-xs">
                    This means {getPersonName(selectedParent)} will be the parent of {getPersonName(selectedChild)}
                  </span>
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={!selectedParent || !selectedChild || selectedParent === selectedChild || isCreating}
              className="w-full"
            >
              {isCreating ? 'Creating...' : '👨‍👩‍👧‍👦 Create Relationship'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Delete Relationship */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            Remove Relationship
          </CardTitle>
          <CardDescription>
            Remove existing parent-child relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeleteRelationship} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delete-parent-select" className="flex items-center gap-1 mb-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Parent
                </Label>
                <Select value={deleteParent} onValueChange={setDeleteParent}>
                  <SelectTrigger id="delete-parent-select">
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person: Person) => (
                      <SelectItem key={`del-parent-${person.id}`} value={person.id.toString()}>
                        {person.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="delete-child-select" className="flex items-center gap-1 mb-2">
                  <Baby className="h-4 w-4 text-blue-500" />
                  Child
                </Label>
                <Select value={deleteChild} onValueChange={setDeleteChild}>
                  <SelectTrigger id="delete-child-select">
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person: Person) => (
                      <SelectItem 
                        key={`del-child-${person.id}`} 
                        value={person.id.toString()}
                        disabled={deleteParent === person.id.toString()}
                      >
                        {person.full_name}
                        {deleteParent === person.id.toString() && ' (same as parent)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {deleteParent && deleteChild && deleteParent !== deleteChild && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  <strong>Removing:</strong> {getPersonName(deleteParent)} → {getPersonName(deleteChild)}
                  <br />
                  <span className="text-xs">
                    This will remove the parent-child relationship between these people
                  </span>
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              variant="destructive"
              disabled={!deleteParent || !deleteChild || deleteParent === deleteChild || isDeleting}
              className="w-full"
            >
              {isDeleting ? 'Removing...' : '🗑️ Remove Relationship'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">How Relationships Work</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Parent → Child:</strong> Creates a direct lineage connection</li>
                <li>• <strong>One relationship at a time:</strong> Each form creates one parent-child link</li>
                <li>• <strong>Multiple relationships:</strong> People can have multiple parents and children</li>
                <li>• <strong>Visual display:</strong> Check the "Family Tree" tab to see connections</li>
              </ul>
              <div className="mt-3 p-2 bg-yellow-100 rounded border">
                <p className="text-xs text-yellow-800">
                  <strong>⚠️ Stub Backend:</strong> Relationships are managed by stub implementations and won't persist.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}