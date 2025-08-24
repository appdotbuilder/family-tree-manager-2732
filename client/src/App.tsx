import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, TreePine } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { PersonList } from '@/components/PersonList';
import { PersonForm } from '@/components/PersonForm';
import { FamilyTree } from '@/components/FamilyTree';
import { RelationshipManager } from '@/components/RelationshipManager';
import type { Person, PersonWithRelationships, CreatePersonInput } from '../../server/src/schema';

function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [familyTreeData, setFamilyTreeData] = useState<PersonWithRelationships[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);

  // Load all people for the person management tab
  const loadPeople = useCallback(async () => {
    try {
      const result = await trpc.getPeople.query();
      setPeople(result);
    } catch (error) {
      console.error('Failed to load people:', error);
    }
  }, []);

  // Load family tree data with relationships
  const loadFamilyTree = useCallback(async () => {
    try {
      const result = await trpc.getFamilyTree.query();
      setFamilyTreeData(result);
    } catch (error) {
      console.error('Failed to load family tree:', error);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadPeople();
    loadFamilyTree();
  }, [loadPeople, loadFamilyTree]);

  const handleCreatePerson = async (formData: CreatePersonInput) => {
    setIsLoading(true);
    try {
      const newPerson = await trpc.createPerson.mutate(formData);
      setPeople((prev: Person[]) => [...prev, newPerson]);
      setShowPersonForm(false);
      // Reload family tree to include new person
      await loadFamilyTree();
    } catch (error) {
      console.error('Failed to create person:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePerson = async (updatedPerson: Person) => {
    // Update the person in the people list
    setPeople((prev: Person[]) => 
      prev.map((p: Person) => p.id === updatedPerson.id ? updatedPerson : p)
    );
    // Reload family tree to reflect changes
    await loadFamilyTree();
  };

  const handleDeletePerson = async (personId: number) => {
    try {
      await trpc.deletePerson.mutate({ id: personId });
      setPeople((prev: Person[]) => prev.filter((p: Person) => p.id !== personId));
      // Reload family tree to reflect changes
      await loadFamilyTree();
    } catch (error) {
      console.error('Failed to delete person:', error);
    }
  };

  const handleRelationshipChange = async () => {
    // Reload family tree when relationships change
    await loadFamilyTree();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TreePine className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-800">🌳 Family Tree</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Manage your family members and explore their relationships
          </p>
          {/* Stub Notice */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Demo Mode:</strong> This application uses stub backend implementations. 
              Data is not persisted and will reset on page refresh.
            </p>
          </div>
        </div>

        <Tabs defaultValue="tree" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="tree" className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              Family Tree
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              People
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Relationships
            </TabsTrigger>
          </TabsList>

          {/* Family Tree Visualization */}
          <TabsContent value="tree">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="h-5 w-5 text-green-600" />
                  Family Tree Visualization
                </CardTitle>
                <CardDescription>
                  Visual representation of family relationships and connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FamilyTree data={familyTreeData} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* People Management */}
          <TabsContent value="people">
            <div className="grid gap-6">
              {/* Add Person Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Family Members
                      </CardTitle>
                      <CardDescription>
                        Add new family members and manage their information
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowPersonForm(!showPersonForm)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Person
                    </Button>
                  </div>
                </CardHeader>
                {showPersonForm && (
                  <CardContent>
                    <PersonForm 
                      onSubmit={handleCreatePerson}
                      onCancel={() => setShowPersonForm(false)}
                      isLoading={isLoading}
                    />
                  </CardContent>
                )}
              </Card>

              {/* People List */}
              <Card>
                <CardContent className="pt-6">
                  <PersonList 
                    people={people}
                    onUpdatePerson={handleUpdatePerson}
                    onDeletePerson={handleDeletePerson}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Relationship Management */}
          <TabsContent value="relationships">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-600" />
                  Manage Relationships
                </CardTitle>
                <CardDescription>
                  Create and manage parent-child relationships between family members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RelationshipManager 
                  people={people}
                  onChange={handleRelationshipChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;