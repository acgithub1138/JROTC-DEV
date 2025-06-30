
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTableRecords } from '@/hooks/email/useTableRecords';

interface RecordSelectorProps {
  tableName: string;
  selectedRecordId: string | null;
  onRecordSelect: (recordId: string, recordData: any) => void;
}

export const RecordSelector: React.FC<RecordSelectorProps> = ({
  tableName,
  selectedRecordId,
  onRecordSelect,
}) => {
  const { data: rawRecords = [], isLoading } = useTableRecords(tableName);
  
  // Type the records as any[] to handle dynamic table queries
  const records: any[] = Array.isArray(rawRecords) ? rawRecords : [];

  const getRecordDisplayName = (record: any) => {
    // Try to find a meaningful display name
    if (record.name) return record.name;
    if (record.title) return record.title;
    if (record.first_name && record.last_name) return `${record.first_name} ${record.last_name}`;
    if (record.email) return record.email;
    if (record.task_number) return record.task_number;
    if (record.cadet_id) return record.cadet_id;
    return record.id?.slice(0, 8) || 'Unknown';
  };

  const handleValueChange = (recordId: string) => {
    const selectedRecord = records.find(record => record.id === recordId);
    if (selectedRecord) {
      onRecordSelect(recordId, selectedRecord);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Select Record for Preview</Label>
      <Select
        value={selectedRecordId || ''}
        onValueChange={handleValueChange}
        disabled={isLoading || records.length === 0}
      >
        <SelectTrigger>
          <SelectValue 
            placeholder={
              isLoading 
                ? 'Loading records...' 
                : records.length === 0 
                  ? 'No records found' 
                  : 'Select a record'
            } 
          />
        </SelectTrigger>
        <SelectContent>
          {records.map((record) => (
            <SelectItem key={record.id} value={record.id}>
              {getRecordDisplayName(record)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
