
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RuleDetailsCardProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const RuleDetailsCard: React.FC<RuleDetailsCardProps> = ({
  name,
  description,
  onNameChange,
  onDescriptionChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rule Details</CardTitle>
        <CardDescription>Basic information about your rule</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Rule Name</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => onNameChange(e.target.value)} 
            placeholder="Enter rule name" 
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={description} 
            onChange={(e) => onDescriptionChange(e.target.value)} 
            placeholder="Describe what this rule does" 
            rows={3} 
          />
        </div>
      </CardContent>
    </Card>
  );
};
