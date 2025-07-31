import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

export interface CriteriaMapping {
  id: string;
  displayName: string;
  originalCriteria: string[];
}

interface AdvancedCriteriaMappingProps {
  availableCriteria: string[];
  mappings: CriteriaMapping[];
  onMappingsChange: (mappings: CriteriaMapping[]) => void;
  selectedEvent: string | null;
  isLoading?: boolean;
}

export const AdvancedCriteriaMapping: React.FC<AdvancedCriteriaMappingProps> = ({
  availableCriteria,
  mappings,
  onMappingsChange,
  selectedEvent,
  isLoading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [newMappingName, setNewMappingName] = useState('');
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [editingName, setEditingName] = useState('');

  // Get criteria that are not yet mapped
  const unmappedCriteria = availableCriteria.filter(criteria => 
    !mappings.some(mapping => mapping.originalCriteria.includes(criteria))
  );

  const handleCreateMapping = () => {
    if (newMappingName.trim() && selectedCriteria.length > 0) {
      const newMapping: CriteriaMapping = {
        id: Date.now().toString(),
        displayName: newMappingName.trim(),
        originalCriteria: [...selectedCriteria]
      };
      
      onMappingsChange([...mappings, newMapping]);
      setNewMappingName('');
      setSelectedCriteria([]);
    }
  };

  const handleDeleteMapping = (mappingId: string) => {
    onMappingsChange(mappings.filter(m => m.id !== mappingId));
  };

  const handleEditMapping = (mappingId: string) => {
    const mapping = mappings.find(m => m.id === mappingId);
    if (mapping) {
      setEditingMapping(mappingId);
      setEditingName(mapping.displayName);
    }
  };

  const handleSaveEdit = (mappingId: string) => {
    if (editingName.trim()) {
      onMappingsChange(mappings.map(m => 
        m.id === mappingId 
          ? { ...m, displayName: editingName.trim() }
          : m
      ));
      setEditingMapping(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMapping(null);
    setEditingName('');
  };

  const handleCriteriaToggle = (criteria: string) => {
    setSelectedCriteria(prev => {
      const newSelected = prev.includes(criteria) 
        ? prev.filter(c => c !== criteria)
        : [...prev, criteria];
      
      // If this is the first criteria being selected and display name is empty, set it
      if (!prev.includes(criteria) && !newMappingName.trim()) {
        setNewMappingName(criteria);
      }
      
      return newSelected;
    });
  };

  if (!selectedEvent || availableCriteria.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Criteria Mapping</CardTitle>
              <div className="flex items-center gap-2">
                {mappings.length > 0 && (
                  <Badge variant="secondary">{mappings.length} mappings</Badge>
                )}
                <Button variant="ghost" size="sm">
                  {isOpen ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Group similar criteria together (e.g., "6. Routine Marching" + "6. Routine Marching/Movement")
            </p>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Create New Mapping */}
            {unmappedCriteria.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Create New Mapping:</h4>
                
                <div className="space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="w-1/4">
                      <Label htmlFor="mapping-name">Display Name</Label>
                      <Input
                        id="mapping-name"
                        value={newMappingName}
                        onChange={(e) => setNewMappingName(e.target.value)}
                        placeholder="e.g., Routine Marching"
                      />
                    </div>
                    <Button 
                      onClick={handleCreateMapping}
                      disabled={!newMappingName.trim() || selectedCriteria.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Mapping
                    </Button>
                  </div>

                  <div>
                    <Label>Select Criteria to Group:</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                      {unmappedCriteria.map((criteria) => (
                        <div key={criteria} className="flex items-center space-x-2">
                          <Checkbox
                            id={`criteria-${criteria}`}
                            checked={selectedCriteria.includes(criteria)}
                            onCheckedChange={() => handleCriteriaToggle(criteria)}
                          />
                          <Label 
                            htmlFor={`criteria-${criteria}`} 
                            className="text-sm cursor-pointer flex-1"
                          >
                            {criteria}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Mappings */}
            {mappings.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">Current Mappings:</h4>
                {mappings.map((mapping) => (
                  <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      {editingMapping === mapping.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="max-w-xs"
                            placeholder="Display name"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveEdit(mapping.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{mapping.displayName}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Maps: {mapping.originalCriteria.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                    {editingMapping !== mapping.id && (
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditMapping(mapping.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteMapping(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {unmappedCriteria.length === 0 && mappings.length > 0 && (
              <div className="text-center text-muted-foreground py-4">
                All criteria have been mapped!
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};