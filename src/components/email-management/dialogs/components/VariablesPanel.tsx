import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VariablesPanelProps {
  columns: Array<{ name: string; label: string }>;
  enhancedVariables: Array<{ name: string; label: string; description?: string }>;
  onVariableInsert: (variableName: string) => void;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({
  columns,
  enhancedVariables,
  onVariableInsert,
}) => {
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
                      onClick={() => onVariableInsert(variable.name)}
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

            {columns.length > 0 && (
              <div>
                <h4 className="text-xs font-medium mb-2">Basic Fields</h4>
                <div className="space-y-1">
                  {columns.map((column) => (
                    <Button
                      key={column.name}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-auto p-2"
                      onClick={() => onVariableInsert(column.name)}
                    >
                      <Badge variant="secondary" className="mr-2 text-xs">
                        {column.name}
                      </Badge>
                      <span className="truncate">{column.label}</span>
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