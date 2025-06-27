
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TriggerConfigCardProps {
  triggerType: string;
  triggerTable: string;
  tables: string[];
  onTriggerTypeChange: (value: string) => void;
  onTriggerTableChange: (value: string) => void;
}

const triggerTypes = [
  { value: 'record_created', label: 'Record Created' },
  { value: 'record_updated', label: 'Record Updated' },
  { value: 'record_deleted', label: 'Record Deleted' },
  { value: 'time_based', label: 'Time-based Trigger' }
];

export const TriggerConfigCard: React.FC<TriggerConfigCardProps> = ({
  triggerType,
  triggerTable,
  tables,
  onTriggerTypeChange,
  onTriggerTableChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trigger - "When to run"</CardTitle>
        <CardDescription>Define when this rule should execute</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="trigger-type">Trigger Type</Label>
          <Select value={triggerType} onValueChange={onTriggerTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select trigger type" />
            </SelectTrigger>
            <SelectContent>
              {triggerTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="trigger-table">Table</Label>
          <Select value={triggerTable} onValueChange={onTriggerTableChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
