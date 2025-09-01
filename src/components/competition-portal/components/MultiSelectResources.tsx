import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Users, X } from 'lucide-react';

interface Resource {
  id: string;
  first_name: string;
  last_name: string;
}

interface MultiSelectResourcesProps {
  resources: Resource[];
  selectedResourceIds: string[];
  onChange: (resourceIds: string[]) => void;
  disabled?: boolean;
}

export const MultiSelectResources: React.FC<MultiSelectResourcesProps> = ({
  resources,
  selectedResourceIds,
  onChange,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredResources = resources.filter(resource => 
    `${resource.last_name}, ${resource.first_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedResources = resources.filter(resource => 
    selectedResourceIds.includes(resource.id)
  );

  const handleToggleResource = (resourceId: string) => {
    if (disabled) return;
    
    if (selectedResourceIds.includes(resourceId)) {
      onChange(selectedResourceIds.filter(id => id !== resourceId));
    } else {
      onChange([...selectedResourceIds, resourceId]);
    }
  };

  const handleRemove = (resourceId: string) => {
    if (disabled) return;
    onChange(selectedResourceIds.filter(id => id !== resourceId));
  };

  return (
    <div className="space-y-3">
      {/* Collapsible Selector */}
      {!disabled && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Add Resource</span>
                {selectedResourceIds.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({selectedResourceIds.length} selected)
                  </span>
                )}
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <Input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <div className="max-h-[200px] overflow-y-auto space-y-1 border rounded-md p-2">
              {filteredResources.length > 0 ? (
                filteredResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
                  >
                    <Checkbox
                      checked={selectedResourceIds.includes(resource.id)}
                      onCheckedChange={() => handleToggleResource(resource.id)}
                    />
                    <div className="flex-1 cursor-pointer">
                      {resource.last_name}, {resource.first_name}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  {searchTerm ? 'No resources found' : 'No resources available'}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};