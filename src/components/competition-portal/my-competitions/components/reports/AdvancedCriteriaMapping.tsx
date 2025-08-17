import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Save } from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);
  
  // Sync localMappings with mappings prop when it changes
  useEffect(() => {
    setLocalMappings(mappings);
  }, [mappings]);
  
  const handleSaveFunction = onSave || onMappingsChange || (async () => {});

  const addMapping = () => {
    const newMapping: CriteriaMapping = {
      original_criteria: [],
      display_name: '',
      event_type: selectedEvent,
      school_id: '', // Will be set by the hook
      is_global: false,
      usage_count: 1
    };
    setLocalMappings([...localMappings, newMapping]);
  };

  const removeMapping = (index: number) => {
    setLocalMappings(localMappings.filter((_, i) => i !== index));
  };

  const updateMapping = (index: number, updates: Partial<CriteriaMapping>) => {
    const updatedMappings = [...localMappings];
    updatedMappings[index] = { ...updatedMappings[index], ...updates };
    setLocalMappings(updatedMappings);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await handleSaveFunction(localMappings);
      toast.success('Criteria mappings saved successfully');
    } catch (error) {
      toast.error('Failed to save criteria mappings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Advanced Criteria Mapping
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addMapping}>
              <Plus className="w-4 h-4 mr-2" />
              Add Mapping
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {localMappings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No criteria mappings configured. Click "Add Mapping" to create one.
          </p>
        ) : (
          localMappings.map((mapping, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Mapping {index + 1}</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeMapping(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`display-name-${index}`}>Display Name</Label>
                  <Input
                    id={`display-name-${index}`}
                    value={mapping.display_name}
                    onChange={(e) => updateMapping(index, { display_name: e.target.value })}
                    placeholder="Enter display name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`original-criteria-${index}`}>Original Criteria (comma-separated)</Label>
                  <Input
                    id={`original-criteria-${index}`}
                    value={mapping.original_criteria.join(', ')}
                    onChange={(e) => updateMapping(index, { 
                      original_criteria: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="Enter original criteria names"
                  />
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Usage count: {mapping.usage_count || 1}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};