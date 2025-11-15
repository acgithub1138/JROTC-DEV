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
export const JsonPreview: React.FC<JsonPreviewProps> = ({
  value,
  isExpanded,
  onToggleExpanded
}) => {
  const jsonPreview = JSON.stringify(value, null, 2);
  return <Card>
      
    </Card>;
};