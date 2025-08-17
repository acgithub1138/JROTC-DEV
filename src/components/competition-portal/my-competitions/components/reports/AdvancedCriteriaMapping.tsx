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
import { toast } from 'sonner';

export interface CriteriaMapping {
  id?: string;
  original_criteria: string[];
  display_name: string;
  event_type: string;
  school_id: string;
  is_global: boolean;
  usage_count: number;
}

interface AdvancedCriteriaMappingProps {
  mappings?: CriteriaMapping[];
  onSave?: (mappings: CriteriaMapping[]) => Promise<void>;
  onMappingsChange?: (mappings: CriteriaMapping[]) => Promise<void>;
  originalCriteria?: string[];
  availableCriteria?: string[];
  selectedEvent: string;
  isLoading?: boolean;
}

export const AdvancedCriteriaMapping: React.FC<AdvancedCriteriaMappingProps> = ({
  mappings = [],
  onSave,
  onMappingsChange,
  originalCriteria = [],
  availableCriteria = [],
  selectedEvent,
  isLoading = false
}) => {
  const [localMappings, setLocalMappings] = useState<CriteriaMapping[]>(mappings);
  const [isOpen, setIsOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [newMappingName, setNewMappingName] = useState('');
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Sync localMappings with mappings prop when it changes
  useEffect(() => {
    setLocalMappings(mappings);
  }, [mappings]);
  
  const handleSaveFunction = onSave || onMappingsChange || (async () => {});

  // Get criteria that are not yet mapped
  const unmappedCriteria = availableCriteria.filter(criteria => 
    !localMappings.some(mapping => mapping.original_criteria.includes(criteria))
  );

  const handleCreateMapping = async () => {
    if (newMappingName.trim() && selectedCriteria.length > 0) {
      const newMapping: CriteriaMapping = {
        original_criteria: [...selectedCriteria],
        display_name: newMappingName.trim(),
        event_type: selectedEvent,
        school_id: '', // Will be set by the hook
        is_global: false,
        usage_count: 1
      };
      
      const updatedMappings = [...localMappings, newMapping];
      setLocalMappings(updatedMappings);
      
      try {
        await handleSaveFunction(updatedMappings);
        setNewMappingName('');
        setSelectedCriteria([]);
        toast.success('Mapping created successfully');
      } catch (error) {
        toast.error('Failed to create mapping');
        setLocalMappings(localMappings); // Revert on error
      }
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    const updatedMappings = localMappings.filter(m => m.id !== mappingId);
    setLocalMappings(updatedMappings);
    
    try {
      await handleSaveFunction(updatedMappings);
      toast.success('Mapping deleted successfully');
    } catch (error) {
      toast.error('Failed to delete mapping');
      setLocalMappings(localMappings); // Revert on error
    }
  };

  const handleEditMapping = (mappingId: string) => {
    const mapping = localMappings.find(m => m.id === mappingId);
    if (mapping) {
      setEditingMapping(mappingId);
      setEditingName(mapping.display_name);
    }
  };

  const handleSaveEdit = async (mappingId: string) => {
    if (editingName.trim()) {
      const updatedMappings = localMappings.map(m => 
        m.id === mappingId 
          ? { ...m, display_name: editingName.trim() }
          : m
      );
      setLocalMappings(updatedMappings);
      
      try {
        await handleSaveFunction(updatedMappings);
        setEditingMapping(null);
        setEditingName('');
        toast.success('Mapping updated successfully');
      } catch (error) {
        toast.error('Failed to update mapping');
        setLocalMappings(localMappings); // Revert on error
      }
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
                {localMappings.length > 0 && (
                  <Badge variant="secondary">{localMappings.length} mappings</Badge>
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
                      disabled={!newMappingName.trim() || selectedCriteria.length === 0 || isSaving}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Mapping
                    </Button>
                  </div>

                  <div>
                    <Label>Select Criteria to Group:</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
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
            {localMappings.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">Current Mappings:</h4>
                {localMappings.map((mapping) => (
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
                          <Button size="sm" onClick={() => handleSaveEdit(mapping.id)} disabled={isSaving}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{mapping.display_name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Maps: {mapping.original_criteria.join(', ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Usage count: {mapping.usage_count || 1}
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
                          disabled={isSaving}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteMapping(mapping.id)}
                          disabled={isSaving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {unmappedCriteria.length === 0 && localMappings.length > 0 && (
              <div className="text-center text-muted-foreground py-4">
                All criteria have been mapped!
              </div>
            )}

            {unmappedCriteria.length === 0 && localMappings.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No criteria mappings configured. Add criteria to create mappings.
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};