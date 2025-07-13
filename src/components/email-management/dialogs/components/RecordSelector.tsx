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
  const { data: records = [], isLoading } = useTableRecords(tableName);

  const handleRecordChange = (recordId: string) => {
    const selectedRecord = records.find(r => r.id === recordId);
    if (selectedRecord) {
      onRecordSelect(recordId, selectedRecord);
    }
  };

  const getRecordLabel = (record: any) => {
    // Try common display fields
    const displayFields = ['title', 'name', 'subject', 'item', 'description'];
    for (const field of displayFields) {
      if (record[field]) {
        return record[field];
      }
    }
    // Fallback to ID
    return record.id.slice(0, 8);
  };

  return (
    <div className="space-y-2">
      <Label>Select Record for Preview</Label>
      <Select value={selectedRecordId || ''} onValueChange={handleRecordChange}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading records..." : "Select a record"} />
        </SelectTrigger>
        <SelectContent>
          {records.map((record) => (
            <SelectItem key={record.id} value={record.id}>
              {getRecordLabel(record)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};