import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface FieldMapping {
  csvColumn: string;
  dbField: string | null;
}

interface FieldMappingSectionProps {
  csvHeaders: string[];
  fieldMappings: FieldMapping[];
  onMappingChange: (csvColumn: string, dbField: string | null) => void;
  onAutoMap: () => void;
  onProceed: () => void;
  onBack: () => void;
}

const DATABASE_FIELDS = [
  { value: 'item_id', label: 'Item ID', required: false },
  { value: 'item', label: 'Item Name *', required: true },
  { value: 'category', label: 'Category *', required: true },
  { value: 'sub_category', label: 'Sub Category *', required: true },
  { value: 'size', label: 'Size', required: false },
  { value: 'gender', label: 'Gender', required: false },
  { value: 'qty_total', label: 'Total Quantity', required: false },
  { value: 'qty_issued', label: 'Issued Quantity', required: false },
  { value: 'stock_number', label: 'Stock Number', required: false },
  { value: 'unit_of_measure', label: 'Unit of Measure', required: false },
  { value: 'has_serial_number', label: 'Has Serial Number', required: false },
  { value: 'model_number', label: 'Model Number', required: false },
  { value: 'returnable', label: 'Returnable', required: false },
  { value: 'accountable', label: 'Accountable', required: false },
  { value: 'description', label: 'Description', required: false },
  { value: 'condition', label: 'Condition', required: false },
  { value: 'location', label: 'Location', required: false },
  { value: 'notes', label: 'Notes', required: false },
  { value: 'pending_updates', label: 'Pending Updates', required: false },
  { value: 'pending_issue_changes', label: 'Pending Issue Changes', required: false },
  { value: 'pending_write_offs', label: 'Pending Write Offs', required: false },
];

export const FieldMappingSection: React.FC<FieldMappingSectionProps> = ({
  csvHeaders,
  fieldMappings,
  onMappingChange,
  onAutoMap,
  onProceed,
  onBack,
}) => {
  const mappedFields = fieldMappings.filter(m => m.dbField).map(m => m.dbField);
  const requiredFields = DATABASE_FIELDS.filter(f => f.required);
  const missingRequiredFields = requiredFields.filter(f => !mappedFields.includes(f.value));
  const canProceed = missingRequiredFields.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Map CSV Fields</h3>
          <p className="text-sm text-muted-foreground">
            Map your CSV columns to database fields. Required fields are marked with *.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onAutoMap} size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Auto Map
          </Button>
        </div>
      </div>

      {missingRequiredFields.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-destructive">Missing Required Fields</CardTitle>
            <CardDescription>
              The following required fields must be mapped before proceeding:
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {missingRequiredFields.map((field) => (
                <Badge key={field.value} variant="destructive">
                  {field.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {csvHeaders.map((header, index) => {
          const mapping = fieldMappings.find(m => m.csvColumn === header);
          const selectedField = DATABASE_FIELDS.find(f => f.value === mapping?.dbField);
          
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">CSV Column</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm">
                      {header}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Database Field</Label>
                    <Select
                      value={mapping?.dbField || 'none'}
                      onValueChange={(value) => onMappingChange(header, value === 'none' ? null : value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Don't map</SelectItem>
                        {DATABASE_FIELDS.map((field) => {
                          const isAlreadyMapped = mappedFields.includes(field.value) && field.value !== mapping?.dbField;
                          return (
                            <SelectItem 
                              key={field.value} 
                              value={field.value}
                              disabled={isAlreadyMapped}
                            >
                              {field.label} {isAlreadyMapped && '(Already mapped)'}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedField?.required && (
                    <Badge variant="secondary" className="shrink-0">
                      Required
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Upload
        </Button>
        <Button 
          onClick={onProceed}
          disabled={!canProceed}
        >
          Preview Data ({fieldMappings.filter(m => m.dbField).length} fields mapped)
        </Button>
      </div>
    </div>
  );
};