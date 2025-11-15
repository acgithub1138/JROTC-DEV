import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface JsonPreviewProps {
  value: Record<string, any>;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
}

export const JsonPreview: React.FC<JsonPreviewProps> = ({ value, isExpanded, onToggleExpanded }) => {
  const jsonPreview = JSON.stringify(value, null, 2);

  return (
    <Card>
      <CardHeader>
        <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="w-full justify-between">
              <span>JSON Preview</span>
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-4">
              <Textarea value={jsonPreview} readOnly className="font-mono text-sm min-h-[200px]" />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};