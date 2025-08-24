import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TreePine, Users, Calendar, ArrowDown } from 'lucide-react';
import type { PersonWithRelationships } from '../../../server/src/schema';

interface FamilyTreeProps {
  data: PersonWithRelationships[];
}

interface TreeNode {
  person: PersonWithRelationships;
  children: TreeNode[];
  level: number;
}

export function FamilyTree({ data }: FamilyTreeProps) {
  // Build tree structure from flat data
  const treeStructure = useMemo(() => {
    if (data.length === 0) return [];

    // Find root nodes (people with no parents)
    const rootPeople = data.filter((person: PersonWithRelationships) => 
      person.parents.length === 0
    );

    // Build tree recursively
    const buildTree = (person: PersonWithRelationships, level: number): TreeNode => {
      const children = person.children.map((child) => {
        const childWithRelationships = data.find((p: PersonWithRelationships) => p.id === child.id);
        return childWithRelationships ? buildTree(childWithRelationships, level + 1) : null;
      }).filter(Boolean) as TreeNode[];

      return {
        person,
        children,
        level
      };
    };

    return rootPeople.map((person: PersonWithRelationships) => buildTree(person, 0));
  }, [data]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

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

  // Render individual person card
  const renderPersonCard = (person: PersonWithRelationships) => (
    <Card key={person.id} className="w-64 hover:shadow-lg transition-shadow border-2 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={person.photo_url || undefined} alt={person.full_name} />
            <AvatarFallback className="bg-green-100 text-green-600">
              {getInitials(person.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{person.full_name}</h3>
            {person.birth_date && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(person.birth_date)}</span>
                {calculateAge(person.birth_date, person.death_date) && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {calculateAge(person.birth_date, person.death_date)}y
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-1 text-xs">
          {person.parents.length > 0 && (
            <div className="text-gray-600">
              <strong>Parents:</strong> {person.parents.map((p) => p.full_name).join(', ')}
            </div>
          )}
          {person.children.length > 0 && (
            <div className="text-gray-600">
              <strong>Children:</strong> {person.children.length}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render tree node recursively
  const renderTreeNode = (node: TreeNode): React.ReactElement => (
    <div key={node.person.id} className="flex flex-col items-center">
      {renderPersonCard(node.person)}
      
      {node.children.length > 0 && (
        <>
          <div className="w-px h-8 bg-green-300 my-2" />
          <ArrowDown className="h-4 w-4 text-green-500 mb-2" />
          
          <div className="flex gap-8 items-start">
            {node.children.map((child: TreeNode) => (
              <div key={child.person.id} className="relative">
                {node.children.length > 1 && (
                  <div className="absolute -top-6 left-1/2 w-px h-6 bg-green-300 transform -translate-x-1/2" />
                )}
                {renderTreeNode(child)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Show message when no data
  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <TreePine className="h-20 w-20 text-gray-300 mx-auto mb-6" />
        <h3 className="text-xl font-medium text-gray-900 mb-3">No Family Tree Data</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Your family tree will appear here once you add people and establish relationships between them.
        </p>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Add family members in the "People" tab
          </div>
          <div className="flex items-center justify-center gap-2 text-purple-600">
            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            Create relationships in the "Relationships" tab
          </div>
          <div className="flex items-center justify-center gap-2 text-green-600">
            <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            View the family tree here!
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200 max-w-lg mx-auto">
          <p className="text-sm text-yellow-800">
            <strong>📝 Stub Backend Note:</strong> The family tree visualization uses stub data from the backend. 
            In a real implementation, this would show the actual relationships you've created.
          </p>
        </div>
      </div>
    );
  }

  // Show message when no tree structure (all people are orphans)
  if (treeStructure.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Connections</h3>
        <p className="text-gray-500 mb-4">
          You have {data.length} family member{data.length !== 1 ? 's' : ''}, but no parent-child relationships have been established.
        </p>
        <p className="text-sm text-purple-700 bg-purple-50 p-3 rounded-lg inline-block">
          💜 Go to the "Relationships" tab to connect your family members!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TreePine className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-800">Family Tree Overview</h2>
        </div>
        <p className="text-gray-600 text-sm">
          Showing {data.length} family member{data.length !== 1 ? 's' : ''} across {treeStructure.length} generation{treeStructure.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Scrollable tree container */}
      <div className="overflow-x-auto overflow-y-auto max-h-screen">
        <div className="inline-flex flex-col items-center gap-8 p-8 min-w-full">
          {treeStructure.map((rootNode: TreeNode, index: number) => (
            <div key={rootNode.person.id} className="w-full flex flex-col items-center">
              {index > 0 && <div className="w-full h-px bg-gray-200 my-8" />}
              {renderTreeNode(rootNode)}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <TreePine className="h-4 w-4" />
          Tree Legend
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-green-100 rounded border-2 border-green-200" />
              <span>Each card represents a family member</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-green-500" />
              <span>Arrows point from parent to child</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">25y</Badge>
              <span>Age badges (calculated from birth date)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-px bg-green-300" />
              <span>Lines show family connections</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}