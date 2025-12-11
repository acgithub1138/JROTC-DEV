import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface VariablesPanelProps {
  columns: Array<{ name: string; label: string }>;
  enhancedVariables: Array<{ name: string; label: string; description?: string }>;
  groupedReferenceFields?: Array<{ 
    group: string; 
    groupLabel: string; 
    fields: Array<{ name: string; label: string }> 
  }>;
  contextVariables?: Array<{ name: string; label: string; description?: string }>;
  onVariableInsert: (variableName: string) => void;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({
  columns,
  enhancedVariables,
  groupedReferenceFields = [],
  contextVariables = [],
  onVariableInsert,
}) => {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (group: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(group)) {
      newOpenGroups.delete(group);
    } else {
      newOpenGroups.add(group);
    }
    setOpenGroups(newOpenGroups);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Available Variables</CardTitle>
        <p className="text-xs text-muted-foreground">
          Click to insert into template
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {enhancedVariables.length > 0 && (
              <div>
                <h4 className="text-xs font-medium mb-2">Enhanced Variables</h4>
                <div className="space-y-1">
                  {enhancedVariables.map((variable) => (
                    <Button
                      key={variable.name}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs h-auto p-2"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onVariableInsert(variable.name);
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium">{variable.label}</div>
                        {variable.description && (
                          <div className="text-muted-foreground text-xs">
                            {variable.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {groupedReferenceFields.length > 0 && (
              <div>
                <h4 className="text-xs font-medium mb-2">Reference Fields</h4>
                <div className="space-y-1">
                  {groupedReferenceFields.map((group) => (
                    <Collapsible 
                      key={group.group}
                      open={openGroups.has(group.group)}
                      onOpenChange={() => toggleGroup(group.group)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs h-auto p-2 hover:bg-muted"
                        >
                          {openGroups.has(group.group) ? (
                            <ChevronDown className="h-3 w-3 mr-2" />
                          ) : (
                            <ChevronRight className="h-3 w-3 mr-2" />
                          )}
                          <span className="font-medium">{group.groupLabel}</span>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-5">
                        <div className="space-y-1 pt-1">
                          {group.fields.map((field) => (
                            <Button
                              key={field.name}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-xs h-auto p-2"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onVariableInsert(field.name);
                              }}
                            >
                              <span className="truncate">{field.label}</span>
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            )}

            {columns.length > 0 && (
              <div>
                <h4 className="text-xs font-medium mb-2">Basic Fields</h4>
                <div className="space-y-1">
                  {columns.map((column) => (
                    <Button
                      key={column.name}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs h-auto p-2"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onVariableInsert(column.name);
                      }}
                    >
                      <span className="truncate">{column.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {contextVariables.length > 0 && (
              <div>
                <h4 className="text-xs font-medium mb-2">Context Variables</h4>
                <div className="space-y-1">
                  {contextVariables.map((variable) => (
                    <Button
                      key={variable.name}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs h-auto p-2"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onVariableInsert(variable.name);
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium">{variable.label}</div>
                        {variable.description && (
                          <div className="text-muted-foreground text-xs">
                            {variable.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};