import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SchoolOption {
  id: string;
  name: string;
}

interface SchoolSelectorProps {
  schools: SchoolOption[];
  selectedSchoolId: string;
  onSchoolChange: (schoolId: string) => void;
}

export const SchoolSelector: React.FC<SchoolSelectorProps> = ({
  schools,
  selectedSchoolId,
  onSchoolChange,
}) => {
  const sortedSchools = [...schools].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex gap-4 items-center">
      <label className="text-sm font-medium">Select School:</label>
      <Select value={selectedSchoolId} onValueChange={onSchoolChange}> 
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Choose a school..." />
        </SelectTrigger>
        <SelectContent className="z-50 bg-background">
          {sortedSchools.map((school) => (
            <SelectItem key={school.id} value={school.id}>
              {school.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
