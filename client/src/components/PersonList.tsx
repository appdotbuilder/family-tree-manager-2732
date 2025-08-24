import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Calendar, User, Users } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Person, UpdatePersonInput } from '../../../server/src/schema';

interface PersonListProps {
  people: Person[];
  onUpdatePerson: (updatedPerson: Person) => void;
  onDeletePerson: (personId: number) => void;
}

export function PersonList({ people, onUpdatePerson, onDeletePerson }: PersonListProps) {
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdatePersonInput>({ id: 0 });

  const calculateAge = (birthDate: Date | null, deathDate: Date | null): string => {
    if (!birthDate) return '';
    
    const endDate = deathDate || new Date();
    const age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
      return `${age - 1}`;
    }
    
    return `${age}`;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditClick = (person: Person) => {
    setEditingPerson(person);
    setEditFormData({
      id: person.id,
      full_name: person.full_name,
      birth_date: person.birth_date,
      death_date: person.death_date,
      photo_url: person.photo_url
    });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;

    setIsUpdating(true);
    try {
      const updatedPerson = await trpc.updatePerson.mutate(editFormData);
      onUpdatePerson(updatedPerson);
      setEditingPerson(null);
      setEditFormData({ id: 0 });
    } catch (error) {
      console.error('Failed to update person:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (personId: number) => {
    onDeletePerson(personId);
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (field: 'birth_date' | 'death_date', value: string) => {
    setEditFormData((prev: UpdatePersonInput) => ({
      ...prev,
      [field]: value ? new Date(value) : null
    }));
  };

  if (people.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No family members yet</h3>
        <p className="text-gray-500 mb-4">
          Start building your family tree by adding your first family member.
        </p>
        <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg inline-block">
          📝 <strong>Stub Notice:</strong> People added will appear here, but data won't persist due to stub backend.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Family Members ({people.length})
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {people.map((person: Person) => (
          <Card key={person.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={person.photo_url || undefined} alt={person.full_name} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                    {getInitials(person.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg text-gray-900 truncate">
                    {person.full_name}
                  </h4>
                  
                  {person.birth_date && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Born: {formatDate(person.birth_date)}</span>
                      {calculateAge(person.birth_date, person.death_date) && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {calculateAge(person.birth_date, person.death_date)} years
                          {person.death_date ? ' (at death)' : ' old'}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {person.death_date && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Died: {formatDate(person.death_date)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditClick(person)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  
                  {editingPerson?.id === person.id && (
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Edit {editingPerson.full_name}
                        </DialogTitle>
                        <DialogDescription>
                          Update the information for this family member.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleUpdateSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="edit_full_name">Full Name</Label>
                          <Input
                            id="edit_full_name"
                            value={editFormData.full_name || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setEditFormData((prev: UpdatePersonInput) => ({ 
                                ...prev, 
                                full_name: e.target.value 
                              }))
                            }
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit_birth_date">Birth Date</Label>
                            <Input
                              id="edit_birth_date"
                              type="date"
                              value={formatDateForInput(editFormData.birth_date || null)}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleDateChange('birth_date', e.target.value)
                              }
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit_death_date">Death Date</Label>
                            <Input
                              id="edit_death_date"
                              type="date"
                              value={formatDateForInput(editFormData.death_date || null)}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleDateChange('death_date', e.target.value)
                              }
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="edit_photo_url">Photo URL</Label>
                          <Input
                            id="edit_photo_url"
                            type="url"
                            value={editFormData.photo_url || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setEditFormData((prev: UpdatePersonInput) => ({ 
                                ...prev, 
                                photo_url: e.target.value || null 
                              }))
                            }
                            placeholder="https://example.com/photo.jpg"
                          />
                        </div>
                        
                        <DialogFooter>
                          <Button type="submit" disabled={isUpdating}>
                            {isUpdating ? 'Updating...' : 'Update'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  )}
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex-1">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Family Member</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete <strong>{person.full_name}</strong>? 
                        This action cannot be undone and will also remove all their relationships.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteClick(person.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}